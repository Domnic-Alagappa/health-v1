use async_trait::async_trait;
use crate::domain::entities::Role;
use crate::shared::AppResult;
use uuid::Uuid;

#[async_trait]
pub trait RoleRepository: Send + Sync {
    async fn create(&self, role: Role) -> AppResult<Role>;
    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Role>>;
    async fn find_by_name(&self, name: &str) -> AppResult<Option<Role>>;
    async fn list(&self) -> AppResult<Vec<Role>>;
    async fn add_permission_to_role(&self, role_id: Uuid, permission_id: Uuid) -> AppResult<()>;
    async fn remove_permission_from_role(&self, role_id: Uuid, permission_id: Uuid) -> AppResult<()>;
    async fn get_role_permissions(&self, role_id: Uuid) -> AppResult<Vec<Uuid>>;
    async fn get_user_roles(&self, user_id: Uuid) -> AppResult<Vec<Role>>;
}

