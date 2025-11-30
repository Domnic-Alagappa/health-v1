use async_trait::async_trait;
use crate::domain::entities::EncryptionKey;
use crate::shared::AppResult;
use uuid::Uuid;

#[async_trait]
pub trait KeyRepository: Send + Sync {
    async fn create(&self, key: EncryptionKey) -> AppResult<EncryptionKey>;
    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<EncryptionKey>>;
    async fn find_by_entity(&self, entity_id: Uuid, entity_type: &str) -> AppResult<Option<EncryptionKey>>;
    async fn find_active_by_entity(&self, entity_id: Uuid, entity_type: &str) -> AppResult<Option<EncryptionKey>>;
    async fn update(&self, key: EncryptionKey) -> AppResult<EncryptionKey>;
    async fn deactivate_all_for_entity(&self, entity_id: Uuid, entity_type: &str) -> AppResult<()>;
}

