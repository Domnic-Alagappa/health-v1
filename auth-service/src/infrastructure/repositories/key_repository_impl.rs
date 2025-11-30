use crate::domain::entities::EncryptionKey;
use crate::domain::repositories::KeyRepository;
use crate::infrastructure::database::queries::encryption_keys::*;
use crate::shared::AppResult;
use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

pub struct KeyRepositoryImpl {
    pool: PgPool,
}

impl KeyRepositoryImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl KeyRepository for KeyRepositoryImpl {
    async fn create(&self, key: EncryptionKey) -> AppResult<EncryptionKey> {
        sqlx::query_as::<_, EncryptionKey>(ENCRYPTION_KEY_INSERT)
        .bind(key.id)
        .bind(key.entity_id)
        .bind(&key.entity_type)
        .bind(&key.encrypted_key)
        .bind(&key.nonce)
        .bind(&key.key_algorithm)
        .bind(key.created_at)
        .bind(key.rotated_at)
        .bind(key.is_active)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<EncryptionKey>> {
        sqlx::query_as::<_, EncryptionKey>(ENCRYPTION_KEY_FIND_BY_ID)
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_entity(&self, entity_id: Uuid, entity_type: &str) -> AppResult<Option<EncryptionKey>> {
        sqlx::query_as::<_, EncryptionKey>(ENCRYPTION_KEY_FIND_BY_ENTITY)
        .bind(entity_id)
        .bind(entity_type)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_active_by_entity(&self, entity_id: Uuid, entity_type: &str) -> AppResult<Option<EncryptionKey>> {
        sqlx::query_as::<_, EncryptionKey>(ENCRYPTION_KEY_FIND_ACTIVE_BY_ENTITY)
        .bind(entity_id)
        .bind(entity_type)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn update(&self, key: EncryptionKey) -> AppResult<EncryptionKey> {
        sqlx::query_as::<_, EncryptionKey>(ENCRYPTION_KEY_UPDATE)
        .bind(key.id)
        .bind(&key.encrypted_key)
        .bind(&key.nonce)
        .bind(&key.key_algorithm)
        .bind(key.rotated_at)
        .bind(key.is_active)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn deactivate_all_for_entity(&self, entity_id: Uuid, entity_type: &str) -> AppResult<()> {
        sqlx::query(ENCRYPTION_KEY_DEACTIVATE_ALL)
        .bind(entity_id)
        .bind(entity_type)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }
}

