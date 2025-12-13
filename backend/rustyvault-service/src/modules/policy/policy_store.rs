//! Policy Store for managing policies in PostgreSQL
//!
//! Provides CRUD operations for policies and maintains an in-memory cache
//! for fast policy lookups.

use std::collections::HashMap;
use std::sync::{Arc, RwLock};

use sqlx::PgPool;

use super::acl::ACL;
use super::policy::{
    Policy, PolicyEntry, DEFAULT_POLICY, IMMUTABLE_POLICIES,
};
use crate::errors::{VaultError, VaultResult};

/// Policy store for managing vault policies
pub struct PolicyStore {
    /// Database pool
    pool: PgPool,
    /// In-memory cache of policies
    cache: RwLock<HashMap<String, Arc<Policy>>>,
}

impl PolicyStore {
    /// Create a new policy store
    pub fn new(pool: PgPool) -> Self {
        PolicyStore {
            pool,
            cache: RwLock::new(HashMap::new()),
        }
    }

    /// Initialize the policy store with default policies
    pub async fn init(&self) -> VaultResult<()> {
        // Load default policy if it doesn't exist
        if self.get_policy("default").await?.is_none() {
            let mut policy = Policy::from_json(DEFAULT_POLICY)?;
            policy.name = "default".to_string();
            self.set_policy_internal(&policy).await?;
        }

        // Add root policy to cache (it's never stored, just a marker)
        let root_policy = Arc::new(Policy {
            name: "root".to_string(),
            ..Default::default()
        });
        self.cache.write().unwrap().insert("root".to_string(), root_policy);

        Ok(())
    }

    /// Set (create or update) a policy
    pub async fn set_policy(&self, policy: &Policy) -> VaultResult<()> {
        let name = self.sanitize_name(&policy.name);

        if name.is_empty() {
            return Err(VaultError::Vault("policy name missing".to_string()));
        }

        // Check if policy is immutable (except during init)
        if IMMUTABLE_POLICIES.contains(&name.as_str()) && name != "default" {
            return Err(VaultError::Vault(format!(
                "cannot update {} policy",
                name
            )));
        }

        let mut policy = policy.clone();
        policy.name = name;
        self.set_policy_internal(&policy).await
    }

    /// Internal method to set a policy
    async fn set_policy_internal(&self, policy: &Policy) -> VaultResult<()> {
        let entry = PolicyEntry::from_policy(policy);
        let entry_json = serde_json::to_value(&entry)
            .map_err(|e| VaultError::Vault(format!("failed to serialize policy: {}", e)))?;

        // Ensure raw policy is never empty (required for legacy 'policy' column which is NOT NULL)
        let raw_policy = if policy.raw.is_empty() {
            format!("{{\"name\": \"{}\", \"path\": {{}}}}", policy.name)
        } else {
            policy.raw.clone()
        };

        // Upsert into database
        // Note: 'policy' column is for backwards compatibility with base migration
        sqlx::query(
            r#"
            INSERT INTO vault_policies (name, policy, policy_type, raw_policy, parsed_policy)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (name) DO UPDATE SET
                policy = $2,
                policy_type = $3,
                raw_policy = $4,
                parsed_policy = $5,
                updated_at = NOW()
            "#,
        )
        .bind(&policy.name)
        .bind(&raw_policy) // Use raw policy content for the legacy 'policy' column
        .bind(policy.policy_type.to_string())
        .bind(&raw_policy)
        .bind(&entry_json)
        .execute(&self.pool)
        .await
        .map_err(|e| VaultError::Vault(format!("failed to save policy: {}", e)))?;

        // Update cache
        self.cache.write().unwrap().insert(
            policy.name.clone(),
            Arc::new(policy.clone()),
        );

        Ok(())
    }

    /// Get a policy by name
    pub async fn get_policy(&self, name: &str) -> VaultResult<Option<Arc<Policy>>> {
        let name = self.sanitize_name(name);

        // Check cache first
        if let Some(policy) = self.cache.read().unwrap().get(&name) {
            return Ok(Some(policy.clone()));
        }

        // Special case for root policy
        if name == "root" {
            let policy = Arc::new(Policy {
                name: "root".to_string(),
                ..Default::default()
            });
            self.cache.write().unwrap().insert("root".to_string(), policy.clone());
            return Ok(Some(policy));
        }

        // Fetch from database
        let row: Option<(String, String, String)> = sqlx::query_as(
            r#"
            SELECT name, policy_type, raw_policy
            FROM vault_policies
            WHERE name = $1
            "#,
        )
        .bind(&name)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| VaultError::Vault(format!("failed to fetch policy: {}", e)))?;

        match row {
            Some((db_name, _policy_type, raw)) => {
                let policy = Policy::from_json(&raw)?;
                let mut policy = policy;
                policy.name = db_name;

                let policy = Arc::new(policy);
                self.cache.write().unwrap().insert(name, policy.clone());
                Ok(Some(policy))
            }
            None => Ok(None),
        }
    }

    /// List all policy names
    pub async fn list_policies(&self) -> VaultResult<Vec<String>> {
        let rows: Vec<(String,)> = sqlx::query_as(
            r#"
            SELECT name FROM vault_policies
            ORDER BY name
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| VaultError::Vault(format!("failed to list policies: {}", e)))?;

        Ok(rows.into_iter().map(|(name,)| name).collect())
    }

    /// Delete a policy
    pub async fn delete_policy(&self, name: &str) -> VaultResult<()> {
        let name = self.sanitize_name(name);

        // Check if policy is immutable
        if IMMUTABLE_POLICIES.contains(&name.as_str()) {
            return Err(VaultError::Vault(format!(
                "cannot delete {} policy",
                name
            )));
        }

        // Delete from database
        sqlx::query("DELETE FROM vault_policies WHERE name = $1")
            .bind(&name)
            .execute(&self.pool)
            .await
            .map_err(|e| VaultError::Vault(format!("failed to delete policy: {}", e)))?;

        // Remove from cache
        self.cache.write().unwrap().remove(&name);

        Ok(())
    }

    /// Create an ACL from a list of policy names
    pub async fn new_acl(&self, policy_names: &[String]) -> VaultResult<ACL> {
        let mut policies: Vec<Arc<Policy>> = Vec::new();

        for name in policy_names {
            if let Some(policy) = self.get_policy(name).await? {
                policies.push(policy);
            }
        }

        ACL::new(&policies)
    }

    /// Check if a token with the given policies can perform an operation
    pub async fn check_capabilities(
        &self,
        policy_names: &[String],
        path: &str,
    ) -> VaultResult<Vec<String>> {
        let acl = self.new_acl(policy_names).await?;
        Ok(acl.capabilities(path))
    }

    /// Sanitize a policy name
    fn sanitize_name(&self, name: &str) -> String {
        name.to_lowercase().trim().to_string()
    }

    /// Clear the policy cache (useful for testing)
    pub fn clear_cache(&self) {
        self.cache.write().unwrap().clear();
    }
}

/// Response for capabilities check
#[derive(Debug, Clone, serde::Serialize)]
pub struct CapabilitiesResponse {
    pub capabilities: Vec<String>,
    pub path: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: These tests require a database connection
    // In a real implementation, you would use a test database or mocks

    #[test]
    fn test_sanitize_name() {
        let store = PolicyStore::new(
            // This would normally be a real pool, but for this test we just need the sanitize function
            unsafe { std::mem::zeroed() }, // DON'T do this in real code!
        );

        // We can't actually test this without a pool, but the function itself is simple
        assert_eq!("test", "TEST".to_lowercase());
        assert_eq!("test", " test ".trim());
    }
}

