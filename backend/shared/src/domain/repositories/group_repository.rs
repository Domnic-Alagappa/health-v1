use async_trait::async_trait;
use crate::domain::entities::Group;
use crate::shared::AppResult;
use uuid::Uuid;

#[async_trait]
pub trait GroupRepository: Send + Sync {
    async fn create(&self, group: Group) -> AppResult<Group>;
    async fn update(&self, group: Group) -> AppResult<Group>;
    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Group>>;
    async fn find_by_name(&self, name: &str, organization_id: Option<Uuid>) -> AppResult<Option<Group>>;
    async fn find_by_organization(&self, organization_id: Uuid) -> AppResult<Vec<Group>>;
    async fn find_all(&self) -> AppResult<Vec<Group>>;
    async fn soft_delete(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()>;
    async fn restore(&self, id: Uuid) -> AppResult<()>;
}

