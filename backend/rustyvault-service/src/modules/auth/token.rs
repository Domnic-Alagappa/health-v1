//! Token management for RustyVault
//!
//! Handles token creation, validation, renewal, and revocation.


use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use crate::errors::{VaultError, VaultResult};

/// Token entry stored in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TokenEntry {
    /// Token ID (UUID)
    pub id: Uuid,
    /// Hash of the actual token (we never store the raw token)
    pub token_hash: String,
    /// Display name for the token
    pub display_name: String,
    /// Policies attached to this token
    pub policies: Vec<String>,
    /// Parent token ID (if this token was created by another token)
    pub parent: Option<Uuid>,
    /// Time-to-live in seconds
    pub ttl: i64,
    /// When the token expires
    pub expires_at: Option<DateTime<Utc>>,
    /// When the token was created
    pub created_at: DateTime<Utc>,
    /// When the token was last used
    pub last_used_at: Option<DateTime<Utc>>,
    /// Number of times the token can be used (0 = unlimited)
    pub num_uses: i32,
    /// Path that created this token
    pub path: String,
    /// Metadata attached to the token
    pub meta: Option<serde_json::Value>,
    /// Whether the token is renewable
    pub renewable: bool,
    /// Entity ID associated with this token
    pub entity_id: Option<Uuid>,
}

impl TokenEntry {
    /// Check if the token is expired
    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            expires_at < Utc::now()
        } else {
            false // No expiration = never expires
        }
    }

    /// Check if the token has remaining uses
    pub fn has_uses_remaining(&self) -> bool {
        self.num_uses == 0 || self.num_uses > 0
    }
}

/// Request to create a new token
#[derive(Debug, Clone, Deserialize)]
pub struct CreateTokenRequest {
    /// Display name
    #[serde(default)]
    pub display_name: String,
    /// Policies to attach
    #[serde(default)]
    pub policies: Vec<String>,
    /// TTL in seconds (default: 3600)
    #[serde(default = "default_ttl")]
    pub ttl: i64,
    /// Whether the token is renewable
    #[serde(default = "default_renewable")]
    pub renewable: bool,
    /// Number of uses (0 = unlimited)
    #[serde(default)]
    pub num_uses: i32,
    /// Metadata
    #[serde(default)]
    pub meta: Option<serde_json::Value>,
}

fn default_ttl() -> i64 {
    3600
}

fn default_renewable() -> bool {
    true
}

impl Default for CreateTokenRequest {
    fn default() -> Self {
        CreateTokenRequest {
            display_name: String::new(),
            policies: Vec::new(),
            ttl: 3600,
            renewable: true,
            num_uses: 0,
            meta: None,
        }
    }
}

/// Response when creating a token
#[derive(Debug, Clone, Serialize)]
pub struct CreateTokenResponse {
    /// The actual token (only returned on creation)
    pub client_token: String,
    /// Token accessor (can be used to look up token info)
    pub accessor: String,
    /// Policies attached to the token
    pub policies: Vec<String>,
    /// TTL in seconds
    pub ttl: i64,
    /// When the token expires
    pub expires_at: Option<DateTime<Utc>>,
    /// Whether the token is renewable
    pub renewable: bool,
}

/// Token store for managing tokens
pub struct TokenStore {
    pool: PgPool,
}

impl TokenStore {
    /// Create a new token store
    pub fn new(pool: PgPool) -> Self {
        TokenStore { pool }
    }

    /// Create a new token
    pub async fn create_token(
        &self,
        request: &CreateTokenRequest,
        parent_token: Option<&TokenEntry>,
        path: &str,
    ) -> VaultResult<(TokenEntry, String)> {
        // Generate token ID and raw token
        let id = Uuid::new_v4();
        let raw_token = format!("hvs.{}", generate_random_string(26));
        let token_hash = hash_token(&raw_token);
        let _accessor = format!("accessor.{}", generate_random_string(20));

        // Calculate expiration
        let expires_at = if request.ttl > 0 {
            Some(Utc::now() + chrono::Duration::seconds(request.ttl))
        } else {
            None
        };

        // Determine policies (child tokens can only have subset of parent policies)
        let policies = if let Some(parent) = parent_token {
            if parent.policies.contains(&"root".to_string()) {
                request.policies.clone()
            } else {
                // Filter to only policies the parent has
                request
                    .policies
                    .iter()
                    .filter(|p| parent.policies.contains(p))
                    .cloned()
                    .collect()
            }
        } else {
            request.policies.clone()
        };

        let entry = TokenEntry {
            id,
            token_hash: token_hash.clone(),
            display_name: request.display_name.clone(),
            policies,
            parent: parent_token.map(|p| p.id),
            ttl: request.ttl,
            expires_at,
            created_at: Utc::now(),
            last_used_at: None,
            num_uses: request.num_uses,
            path: path.to_string(),
            meta: request.meta.clone(),
            renewable: request.renewable,
            entity_id: None,
        };

        // Store in database
        sqlx::query(
            r#"
            INSERT INTO vault_tokens (
                id, token_hash, display_name, policies, parent_id,
                ttl, expires_at, created_at, num_uses, path, meta, renewable
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            "#,
        )
        .bind(entry.id)
        .bind(&entry.token_hash)
        .bind(&entry.display_name)
        .bind(&entry.policies)
        .bind(entry.parent)
        .bind(entry.ttl)
        .bind(entry.expires_at)
        .bind(entry.created_at)
        .bind(entry.num_uses)
        .bind(&entry.path)
        .bind(&entry.meta)
        .bind(entry.renewable)
        .execute(&self.pool)
        .await
        .map_err(|e| VaultError::Vault(format!("failed to create token: {}", e)))?;

        Ok((entry, raw_token))
    }

    /// Look up a token by its raw value
    pub async fn lookup_token(&self, raw_token: &str) -> VaultResult<Option<TokenEntry>> {
        let token_hash = hash_token(raw_token);

        let row: Option<(
            Uuid,
            String,
            String,
            Vec<String>,
            Option<Uuid>,
            i64,
            Option<DateTime<Utc>>,
            DateTime<Utc>,
            Option<DateTime<Utc>>,
            i32,
            String,
            Option<serde_json::Value>,
            bool,
            Option<Uuid>,
        )> = sqlx::query_as(
            r#"
            SELECT id, token_hash, display_name, policies, parent_id,
                   ttl, expires_at, created_at, last_used_at, num_uses,
                   path, meta, renewable, entity_id
            FROM vault_tokens
            WHERE token_hash = $1
            "#,
        )
        .bind(&token_hash)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| VaultError::Vault(format!("failed to lookup token: {}", e)))?;

        match row {
            Some((
                id,
                hash,
                display_name,
                policies,
                parent,
                ttl,
                expires_at,
                created_at,
                last_used_at,
                num_uses,
                path,
                meta,
                renewable,
                entity_id,
            )) => {
                let entry = TokenEntry {
                    id,
                    token_hash: hash,
                    display_name,
                    policies,
                    parent,
                    ttl,
                    expires_at,
                    created_at,
                    last_used_at,
                    num_uses,
                    path,
                    meta,
                    renewable,
                    entity_id,
                };

                // Check if token is expired
                if entry.is_expired() {
                    // Delete expired token
                    self.revoke_token_by_id(entry.id).await?;
                    return Ok(None);
                }

                Ok(Some(entry))
            }
            None => Ok(None),
        }
    }

    /// Update token last used timestamp and decrement uses
    pub async fn use_token(&self, token_id: Uuid) -> VaultResult<()> {
        sqlx::query(
            r#"
            UPDATE vault_tokens
            SET last_used_at = NOW(),
                num_uses = CASE WHEN num_uses > 0 THEN num_uses - 1 ELSE num_uses END
            WHERE id = $1
            "#,
        )
        .bind(token_id)
        .execute(&self.pool)
        .await
        .map_err(|e| VaultError::Vault(format!("failed to update token: {}", e)))?;

        Ok(())
    }

    /// Revoke a token by its ID
    pub async fn revoke_token_by_id(&self, token_id: Uuid) -> VaultResult<()> {
        // Also revoke all child tokens
        sqlx::query("DELETE FROM vault_tokens WHERE id = $1 OR parent_id = $1")
            .bind(token_id)
            .execute(&self.pool)
            .await
            .map_err(|e| VaultError::Vault(format!("failed to revoke token: {}", e)))?;

        Ok(())
    }

    /// Revoke a token by its raw value
    pub async fn revoke_token(&self, raw_token: &str) -> VaultResult<()> {
        if let Some(entry) = self.lookup_token(raw_token).await? {
            self.revoke_token_by_id(entry.id).await?;
        }
        Ok(())
    }

    /// Renew a token
    pub async fn renew_token(&self, raw_token: &str, increment: Option<i64>) -> VaultResult<TokenEntry> {
        let entry = self
            .lookup_token(raw_token)
            .await?
            .ok_or_else(|| VaultError::Vault("token not found".to_string()))?;

        if !entry.renewable {
            return Err(VaultError::Vault("token is not renewable".to_string()));
        }

        let ttl = increment.unwrap_or(entry.ttl);
        let new_expires_at = Utc::now() + chrono::Duration::seconds(ttl);

        sqlx::query(
            r#"
            UPDATE vault_tokens
            SET expires_at = $1, ttl = $2
            WHERE id = $3
            "#,
        )
        .bind(new_expires_at)
        .bind(ttl)
        .bind(entry.id)
        .execute(&self.pool)
        .await
        .map_err(|e| VaultError::Vault(format!("failed to renew token: {}", e)))?;

        let mut updated = entry;
        updated.expires_at = Some(new_expires_at);
        updated.ttl = ttl;

        Ok(updated)
    }

    /// Create a root token (used during vault initialization)
    pub async fn create_root_token(&self) -> VaultResult<String> {
        let request = CreateTokenRequest {
            display_name: "root".to_string(),
            policies: vec!["root".to_string()],
            ttl: 0, // Never expires
            renewable: false,
            num_uses: 0,
            meta: None,
        };

        let (_, raw_token) = self.create_token(&request, None, "auth/token/root").await?;
        Ok(raw_token)
    }

    /// Clean up expired tokens
    pub async fn cleanup_expired_tokens(&self) -> VaultResult<u64> {
        let result = sqlx::query("DELETE FROM vault_tokens WHERE expires_at < NOW()")
            .execute(&self.pool)
            .await
            .map_err(|e| VaultError::Vault(format!("failed to cleanup tokens: {}", e)))?;

        Ok(result.rows_affected())
    }
}

/// Hash a token for storage
fn hash_token(token: &str) -> String {
    use sha2::{Digest, Sha256};
    let mut hasher = Sha256::new();
    hasher.update(token.as_bytes());
    hex::encode(hasher.finalize())
}

/// Generate a random alphanumeric string
fn generate_random_string(len: usize) -> String {
    use rand::Rng;
    const CHARSET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let mut rng = rand::thread_rng();
    (0..len)
        .map(|_| {
            let idx = rng.gen_range(0..CHARSET.len());
            CHARSET[idx] as char
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_token() {
        let token = "hvs.test_token_123";
        let hash = hash_token(token);
        assert!(!hash.is_empty());
        assert_eq!(hash.len(), 64); // SHA256 produces 64 hex chars

        // Same token should produce same hash
        let hash2 = hash_token(token);
        assert_eq!(hash, hash2);

        // Different token should produce different hash
        let hash3 = hash_token("hvs.different_token");
        assert_ne!(hash, hash3);
    }

    #[test]
    fn test_generate_random_string() {
        let s1 = generate_random_string(26);
        let s2 = generate_random_string(26);
        assert_eq!(s1.len(), 26);
        assert_eq!(s2.len(), 26);
        assert_ne!(s1, s2); // Very unlikely to be equal
    }

    #[test]
    fn test_token_entry_expiration() {
        let mut entry = TokenEntry {
            id: Uuid::new_v4(),
            token_hash: "hash".to_string(),
            display_name: "test".to_string(),
            policies: vec![],
            parent: None,
            ttl: 3600,
            expires_at: Some(Utc::now() + chrono::Duration::hours(1)),
            created_at: Utc::now(),
            last_used_at: None,
            num_uses: 0,
            path: "test".to_string(),
            meta: None,
            renewable: true,
            entity_id: None,
        };

        assert!(!entry.is_expired());

        // Set expired
        entry.expires_at = Some(Utc::now() - chrono::Duration::hours(1));
        assert!(entry.is_expired());

        // No expiration
        entry.expires_at = None;
        assert!(!entry.is_expired());
    }
}

