use crate::config::providers::{StorageProviderConfig, StorageProvider};
use crate::infrastructure::storage::storage_trait::Storage;
use crate::infrastructure::storage::*;
use crate::shared::AppResult;

pub fn create_storage_provider(config: &StorageProviderConfig) -> AppResult<Box<dyn Storage>> {
    match &config.provider {
        StorageProvider::Local => {
            if let Some(ref local_config) = config.local {
                Ok(Box::new(LocalFsStorage::new(&local_config.path)))
            } else {
                Ok(Box::new(LocalFsStorage::new("./storage")))
            }
        }
        StorageProvider::S3 => {
            if let Some(ref s3_config) = config.s3 {
                Ok(Box::new(S3Storage::new(
                    &s3_config.region,
                    &s3_config.bucket,
                    &s3_config.access_key_id,
                    &s3_config.secret_access_key,
                )))
            } else {
                Err(crate::shared::AppError::Configuration(
                    "S3 config not provided".to_string(),
                ))
            }
        }
        StorageProvider::Gcs => {
            if let Some(ref gcs_config) = config.gcs {
                Ok(Box::new(GcsStorage::new(
                    &gcs_config.project_id,
                    &gcs_config.bucket,
                    &gcs_config.credentials_path,
                )))
            } else {
                Err(crate::shared::AppError::Configuration(
                    "GCS config not provided".to_string(),
                ))
            }
        }
        StorageProvider::AzureBlob => {
            if let Some(ref azure_config) = config.azure_blob {
                Ok(Box::new(AzureBlobStorage::new(
                    &azure_config.storage_account,
                    &azure_config.container,
                    &azure_config.tenant_id,
                    &azure_config.client_id,
                    &azure_config.client_secret,
                )))
            } else {
                Err(crate::shared::AppError::Configuration(
                    "Azure Blob config not provided".to_string(),
                ))
            }
        }
    }
}

