use async_trait::async_trait;
use crate::domain::value_objects::EncryptedValue;
use crate::shared::AppResult;
use uuid::Uuid;

#[async_trait]
pub trait EncryptionService: Send + Sync {
    /// Generate a new DEK for an entity
    async fn generate_dek(&self, entity_id: Uuid, entity_type: &str) -> AppResult<Vec<u8>>;
    
    /// Encrypt data using entity's DEK
    async fn encrypt(&self, entity_id: Uuid, entity_type: &str, data: &[u8]) -> AppResult<EncryptedValue>;
    
    /// Decrypt data using entity's DEK
    async fn decrypt(&self, entity_id: Uuid, entity_type: &str, encrypted: &EncryptedValue) -> AppResult<Vec<u8>>;
    
    /// Rotate DEK for an entity
    async fn rotate_dek(&self, entity_id: Uuid, entity_type: &str) -> AppResult<()>;
    
    /// Encrypt field value
    async fn encrypt_field(&self, entity_id: Uuid, entity_type: &str, field_value: &str) -> AppResult<String>;
    
    /// Decrypt field value
    async fn decrypt_field(&self, entity_id: Uuid, entity_type: &str, encrypted_value: &str) -> AppResult<String>;
}

