use async_trait::async_trait;
use crate::shared::AppResult;

/// Key vault trait for storing encrypted DEKs
#[async_trait]
pub trait Vault: Send + Sync {
    /// Store encrypted DEK
    async fn store_dek(&self, entity_id: &str, entity_type: &str, encrypted_dek: &[u8]) -> AppResult<()>;
    
    /// Retrieve encrypted DEK
    async fn get_dek(&self, entity_id: &str, entity_type: &str) -> AppResult<Option<Vec<u8>>>;
    
    /// Delete DEK
    async fn delete_dek(&self, entity_id: &str, entity_type: &str) -> AppResult<()>;
    
    /// Rotate master key (re-encrypt all DEKs)
    async fn rotate_master_key(&self, new_master_key: &[u8]) -> AppResult<()>;
}

