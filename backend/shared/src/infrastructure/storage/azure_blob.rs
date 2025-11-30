use crate::infrastructure::storage::storage_trait::Storage;
use crate::shared::AppResult;
use async_trait::async_trait;

pub struct AzureBlobStorage {
    // Azure Blob Storage implementation placeholder
}

impl AzureBlobStorage {
    pub fn new(_storage_account: &str, _container: &str, _tenant_id: &str, _client_id: &str, _client_secret: &str) -> Self {
        Self {}
    }
}

#[async_trait]
impl Storage for AzureBlobStorage {
    async fn put(&self, _key: &str, _data: &[u8]) -> AppResult<()> {
        Err(crate::shared::AppError::Storage(
            "Azure Blob storage not yet implemented".to_string(),
        ))
    }

    async fn get(&self, _key: &str) -> AppResult<Option<Vec<u8>>> {
        Err(crate::shared::AppError::Storage(
            "Azure Blob storage not yet implemented".to_string(),
        ))
    }

    async fn delete(&self, _key: &str) -> AppResult<()> {
        Err(crate::shared::AppError::Storage(
            "Azure Blob storage not yet implemented".to_string(),
        ))
    }

    async fn list(&self, _prefix: &str) -> AppResult<Vec<String>> {
        Err(crate::shared::AppError::Storage(
            "Azure Blob storage not yet implemented".to_string(),
        ))
    }
}

