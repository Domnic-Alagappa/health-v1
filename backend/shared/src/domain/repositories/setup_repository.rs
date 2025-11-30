use crate::shared::AppResult;
use uuid::Uuid;

#[async_trait::async_trait]
pub trait SetupRepository: Send + Sync {
    /// Check if setup has been completed
    async fn is_setup_completed(&self) -> AppResult<bool>;
    
    /// Mark setup as completed
    async fn mark_setup_completed(&self, completed_by: Option<Uuid>) -> AppResult<()>;
    
    /// Create a new organization
    async fn create_organization(
        &self,
        name: &str,
        slug: &str,
        domain: Option<&str>,
    ) -> AppResult<Uuid>;
    
    /// Get organization by ID
    async fn get_organization(&self, id: &Uuid) -> AppResult<Option<OrganizationInfo>>;
}

#[derive(Debug, Clone)]
pub struct OrganizationInfo {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub domain: Option<String>,
}

