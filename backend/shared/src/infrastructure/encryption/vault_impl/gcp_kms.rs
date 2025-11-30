use crate::infrastructure::encryption::vault::Vault;
use crate::shared::AppResult;
use async_trait::async_trait;

pub struct GcpKmsVault {
    // GCP KMS implementation placeholder
}

impl GcpKmsVault {
    pub fn new(_project_id: &str, _key_ring: &str, _key_name: &str) -> Self {
        Self {}
    }
}

#[async_trait]
impl Vault for GcpKmsVault {
    async fn store_dek(&self, _entity_id: &str, _entity_type: &str, _encrypted_dek: &[u8]) -> AppResult<()> {
        Err(crate::shared::AppError::Encryption(
            "GCP KMS vault not yet implemented".to_string(),
        ))
    }

    async fn get_dek(&self, _entity_id: &str, _entity_type: &str) -> AppResult<Option<Vec<u8>>> {
        Err(crate::shared::AppError::Encryption(
            "GCP KMS vault not yet implemented".to_string(),
        ))
    }

    async fn delete_dek(&self, _entity_id: &str, _entity_type: &str) -> AppResult<()> {
        Err(crate::shared::AppError::Encryption(
            "GCP KMS vault not yet implemented".to_string(),
        ))
    }

    async fn rotate_master_key(&self, _new_master_key: &[u8]) -> AppResult<()> {
        Err(crate::shared::AppError::Encryption(
            "GCP KMS master key rotation not yet implemented".to_string(),
        ))
    }
}

