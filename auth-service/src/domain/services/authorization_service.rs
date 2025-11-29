use async_trait::async_trait;
use crate::shared::AppResult;

#[async_trait]
pub trait AuthorizationService: Send + Sync {
    /// Check if user has permission on object
    /// Returns true if user:user_id#relation@object:object_id relationship exists
    async fn check(&self, user: &str, relation: &str, object: &str) -> AppResult<bool>;
    
    /// Check multiple permissions at once
    async fn check_batch(&self, checks: Vec<(String, String, String)>) -> AppResult<Vec<bool>>;
    
    /// Add relationship tuple
    async fn add_relationship(&self, user: &str, relation: &str, object: &str) -> AppResult<()>;
    
    /// Remove relationship tuple
    async fn remove_relationship(&self, user: &str, relation: &str, object: &str) -> AppResult<()>;
    
    /// Check if user can access resource with action
    async fn can_access(&self, user_id: &str, resource: &str, action: &str) -> AppResult<bool>;
}

