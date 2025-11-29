use async_trait::async_trait;
use crate::infrastructure::zanzibar::RelationshipStore;
use crate::shared::AppResult;

pub struct PermissionChecker {
    store: RelationshipStore,
}

impl PermissionChecker {
    pub fn new(store: RelationshipStore) -> Self {
        Self { store }
    }

    /// Check if user has relation on object
    /// Supports nested relationships (e.g., user is member of group, group has access to resource)
    pub async fn check(&self, user: &str, relation: &str, object: &str) -> AppResult<bool> {
        // Direct check
        if self.store.check(user, relation, object).await? {
            return Ok(true);
        }

        // Check for nested relationships (e.g., user#member@group, group#viewer@resource)
        let user_relationships = self.store.get_relationships(user).await?;
        
        for rel in user_relationships {
            // If user is member of a group, check if group has the relation
            if rel.relation == "member" {
                let group_id = &rel.object;
                if self.store.check(group_id, relation, object).await? {
                    return Ok(true);
                }
            }
        }

        Ok(false)
    }

    /// Batch check multiple permissions
    pub async fn check_batch(&self, checks: Vec<(String, String, String)>) -> AppResult<Vec<bool>> {
        let mut results = Vec::new();
        for (user, relation, object) in checks {
            let result = self.check(&user, &relation, &object).await?;
            results.push(result);
        }
        Ok(results)
    }
}

