use crate::config::providers::{EncryptedLocalStorageConfig, StorageProviderConfig, StorageProvider};
use crate::infrastructure::encryption::DekManager;
use crate::infrastructure::storage::storage_trait::Storage;
use crate::infrastructure::storage::*;
use crate::shared::AppResult;
use std::sync::Arc;
use uuid::Uuid;

/// Create a basic storage provider (without encryption)
/// For encrypted storage, use `create_encrypted_storage_provider`
pub fn create_storage_provider(config: &StorageProviderConfig) -> AppResult<Box<dyn Storage>> {
    match &config.provider {
        StorageProvider::Local => {
            if let Some(ref local_config) = config.local {
                Ok(Box::new(LocalFsStorage::new(&local_config.path)))
            } else {
                Ok(Box::new(LocalFsStorage::new("./storage")))
            }
        }
        StorageProvider::EncryptedLocal => {
            // For encrypted local storage, use create_encrypted_storage_provider instead
            // Fallback to regular local storage if DekManager not available
            if let Some(ref encrypted_config) = config.encrypted_local {
                tracing::warn!(
                    "EncryptedLocal storage requested but DekManager not provided. \
                     Use create_encrypted_storage_provider for encrypted storage. \
                     Falling back to unencrypted local storage."
                );
                Ok(Box::new(LocalFsStorage::new(&encrypted_config.path)))
            } else if let Some(ref local_config) = config.local {
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

/// Create encrypted storage provider for a specific realm
pub fn create_realm_storage(
    config: &EncryptedLocalStorageConfig,
    dek_manager: Arc<DekManager>,
    realm_id: &str,
    realm_uuid: Uuid,
) -> Box<dyn Storage> {
    Box::new(EncryptedLocalFsStorage::for_realm(
        &config.path,
        dek_manager,
        realm_id,
        realm_uuid,
    ))
}

/// Create encrypted storage provider for a specific service
pub fn create_service_storage(
    config: &EncryptedLocalStorageConfig,
    dek_manager: Arc<DekManager>,
    service_id: &str,
    service_uuid: Uuid,
) -> Box<dyn Storage> {
    Box::new(EncryptedLocalFsStorage::for_service(
        &config.path,
        dek_manager,
        service_id,
        service_uuid,
    ))
}

/// Create encrypted storage provider with a global scope
pub fn create_global_encrypted_storage(
    config: &EncryptedLocalStorageConfig,
    dek_manager: Arc<DekManager>,
    scope_name: &str,
    scope_uuid: Uuid,
) -> Box<dyn Storage> {
    Box::new(EncryptedLocalFsStorage::for_global(
        &config.path,
        dek_manager,
        scope_name,
        scope_uuid,
    ))
}

