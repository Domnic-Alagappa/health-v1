use crate::domain::entities::EncryptionKey;
use crate::domain::repositories::KeyRepository;
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
        sqlx::query_as!(
            EncryptionKey,
            r#"
            INSERT INTO encryption_keys (id, entity_id, entity_type, encrypted_key, nonce, key_algorithm, created_at, rotated_at, is_active, request_id, updated_at, created_by, updated_by, system_id, version)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING id, entity_id, entity_type, encrypted_key, nonce, key_algorithm, created_at, rotated_at, is_active, request_id, updated_at, created_by, updated_by, system_id, version
            "#,
            key.id,
            key.entity_id,
            key.entity_type,
            key.encrypted_key,
            key.nonce,
            key.key_algorithm,
            key.created_at,
            key.rotated_at,
            key.is_active,
            key.request_id,
            key.updated_at,
            key.created_by,
            key.updated_by,
            key.system_id,
            key.version
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<EncryptionKey>> {
        sqlx::query_as!(
            EncryptionKey,
            r#"
            SELECT id, entity_id, entity_type, encrypted_key, nonce, key_algorithm, created_at, rotated_at, is_active, request_id, updated_at, created_by, updated_by, system_id, version
            FROM encryption_keys
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_entity(&self, entity_id: Uuid, entity_type: &str) -> AppResult<Option<EncryptionKey>> {
        sqlx::query_as!(
            EncryptionKey,
            r#"
            SELECT id, entity_id, entity_type, encrypted_key, nonce, key_algorithm, created_at, rotated_at, is_active, request_id, updated_at, created_by, updated_by, system_id, version
            FROM encryption_keys
            WHERE entity_id = $1 AND entity_type = $2
            ORDER BY created_at DESC
            LIMIT 1
            "#,
            entity_id,
            entity_type
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_active_by_entity(&self, entity_id: Uuid, entity_type: &str) -> AppResult<Option<EncryptionKey>> {
        sqlx::query_as!(
            EncryptionKey,
            r#"
            SELECT id, entity_id, entity_type, encrypted_key, nonce, key_algorithm, created_at, rotated_at, is_active, request_id, updated_at, created_by, updated_by, system_id, version
            FROM encryption_keys
            WHERE entity_id = $1 AND entity_type = $2 AND is_active = true
            ORDER BY created_at DESC
            LIMIT 1
            "#,
            entity_id,
            entity_type
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn update(&self, key: EncryptionKey) -> AppResult<EncryptionKey> {
        sqlx::query_as!(
            EncryptionKey,
            r#"
            UPDATE encryption_keys
            SET encrypted_key = $2, nonce = $3, key_algorithm = $4, rotated_at = $5, is_active = $6, request_id = $7, updated_at = $8, updated_by = $9, system_id = $10, version = $11
            WHERE id = $1
            RETURNING id, entity_id, entity_type, encrypted_key, nonce, key_algorithm, created_at, rotated_at, is_active, request_id, updated_at, created_by, updated_by, system_id, version
            "#,
            key.id,
            key.encrypted_key,
            key.nonce,
            key.key_algorithm,
            key.rotated_at,
            key.is_active,
            key.request_id,
            key.updated_at,
            key.updated_by,
            key.system_id,
            key.version
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn deactivate_all_for_entity(&self, entity_id: Uuid, entity_type: &str) -> AppResult<()> {
        sqlx::query!(
            r#"
            UPDATE encryption_keys
            SET is_active = false
            WHERE entity_id = $1 AND entity_type = $2 AND is_active = true
            "#,
            entity_id,
            entity_type
        )
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }
}

