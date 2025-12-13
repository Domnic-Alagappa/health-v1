//! Metadata storage using health-v1 PostgreSQL database

use std::sync::Arc;
use async_trait::async_trait;
use sqlx::PgPool;
use crate::errors::VaultResult;
use crate::storage::StorageBackend;

/// Metadata store using PostgreSQL
pub struct MetadataStore {
    pool: Arc<PgPool>,
}

impl MetadataStore {
    pub fn new(pool: Arc<PgPool>) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl StorageBackend for MetadataStore {
    async fn get(&self, key: &str) -> VaultResult<Option<Vec<u8>>> {
        let result = sqlx::query_scalar::<_, Option<Vec<u8>>>(
            "SELECT value FROM vault_metadata WHERE key = $1"
        )
        .bind(key)
        .fetch_optional(self.pool.as_ref())
        .await?;

        Ok(result.flatten())
    }

    async fn put(&self, key: &str, value: &[u8]) -> VaultResult<()> {
        sqlx::query(
            "INSERT INTO vault_metadata (key, value) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP"
        )
        .bind(key)
        .bind(value)
        .execute(self.pool.as_ref())
        .await?;

        Ok(())
    }

    async fn delete(&self, key: &str) -> VaultResult<()> {
        sqlx::query("DELETE FROM vault_metadata WHERE key = $1")
            .bind(key)
            .execute(self.pool.as_ref())
            .await?;

        Ok(())
    }

    async fn list(&self, prefix: &str) -> VaultResult<Vec<String>> {
        let pattern = format!("{}%", prefix);
        let keys = sqlx::query_scalar::<_, String>(
            "SELECT key FROM vault_metadata WHERE key LIKE $1 ORDER BY key"
        )
        .bind(pattern)
        .fetch_all(self.pool.as_ref())
        .await?;

        Ok(keys)
    }
}

