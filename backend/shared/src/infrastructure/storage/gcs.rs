use crate::infrastructure::storage::storage_trait::Storage;
use crate::shared::AppResult;
use async_trait::async_trait;

pub struct GcsStorage {
    // GCP Cloud Storage implementation placeholder
}

impl GcsStorage {
    pub fn new(_project_id: &str, _bucket: &str, _credentials_path: &str) -> Self {
        Self {}
    }
}

#[async_trait]
impl Storage for GcsStorage {
    async fn put(&self, _key: &str, _data: &[u8]) -> AppResult<()> {
        Err(crate::shared::AppError::Storage(
            "GCS storage not yet implemented".to_string(),
        ))
    }

    async fn get(&self, _key: &str) -> AppResult<Option<Vec<u8>>> {
        Err(crate::shared::AppError::Storage(
            "GCS storage not yet implemented".to_string(),
        ))
    }

    async fn delete(&self, _key: &str) -> AppResult<()> {
        Err(crate::shared::AppError::Storage(
            "GCS storage not yet implemented".to_string(),
        ))
    }

    async fn list(&self, _prefix: &str) -> AppResult<Vec<String>> {
        Err(crate::shared::AppError::Storage(
            "GCS storage not yet implemented".to_string(),
        ))
    }
}

