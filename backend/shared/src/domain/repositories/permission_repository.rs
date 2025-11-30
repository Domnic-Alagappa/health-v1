use async_trait::async_trait;
use crate::domain::entities::Permission;
use crate::shared::AppResult;
use uuid::Uuid;

#[async_trait]
pub trait PermissionRepository: Send + Sync {
    async fn create(&self, permission: Permission) -> AppResult<Permission>;
    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Permission>>;
    async fn find_by_name(&self, name: &str) -> AppResult<Option<Permission>>;
    async fn find_by_resource_and_action(&self, resource: &str, action: &str) -> AppResult<Option<Permission>>;
    async fn list(&self) -> AppResult<Vec<Permission>>;
    async fn list_by_resource(&self, resource: &str) -> AppResult<Vec<Permission>>;
}

