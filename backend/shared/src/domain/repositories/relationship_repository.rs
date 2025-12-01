use async_trait::async_trait;
use crate::domain::entities::Relationship;
use crate::shared::AppResult;
use uuid::Uuid;

#[async_trait]
pub trait RelationshipRepository: Send + Sync {
    async fn create(&self, relationship: Relationship) -> AppResult<Relationship>;
    async fn update(&self, relationship: Relationship) -> AppResult<Relationship>;
    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Relationship>>;
    async fn find_by_user(&self, user: &str) -> AppResult<Vec<Relationship>>;
    async fn find_by_object(&self, object: &str) -> AppResult<Vec<Relationship>>;
    async fn find_by_user_and_relation(&self, user: &str, relation: &str) -> AppResult<Vec<Relationship>>;
    async fn find_by_user_object_relation(&self, user: &str, object: &str, relation: &str) -> AppResult<Option<Relationship>>;
    async fn delete(&self, id: Uuid) -> AppResult<()>;
    async fn delete_by_tuple(&self, user: &str, relation: &str, object: &str) -> AppResult<()>;
    async fn soft_delete(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()>;
    async fn list_all(&self) -> AppResult<Vec<Relationship>>;
}

