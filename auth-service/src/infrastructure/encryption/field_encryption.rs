use crate::infrastructure::encryption::DekManager;
use crate::shared::AppResult;
use base64::{Engine as _, engine::general_purpose::STANDARD};
use uuid::Uuid;

pub struct FieldEncryption {
    dek_manager: DekManager,
}

impl FieldEncryption {
    pub fn new(dek_manager: DekManager) -> Self {
        Self { dek_manager }
    }

    /// Encrypt a field value
    pub async fn encrypt_field(&self, entity_id: Uuid, entity_type: &str, field_value: &str) -> AppResult<String> {
        let data = field_value.as_bytes();
        let (ciphertext, nonce) = self.dek_manager.encrypt(entity_id, entity_type, data).await?;
        
        // Combine nonce and ciphertext, encode as base64
        let mut combined = nonce;
        combined.extend_from_slice(&ciphertext);
        Ok(STANDARD.encode(&combined))
    }

    /// Decrypt a field value
    pub async fn decrypt_field(&self, entity_id: Uuid, entity_type: &str, encrypted_value: &str) -> AppResult<String> {
        let combined = STANDARD.decode(encrypted_value)
            .map_err(|e| crate::shared::AppError::Encryption(format!("Base64 decode error: {}", e)))?;
        
        if combined.len() < 12 {
            return Err(crate::shared::AppError::Encryption("Invalid encrypted field format".to_string()));
        }

        let nonce = &combined[..12];
        let ciphertext = &combined[12..];
        
        let plaintext = self.dek_manager.decrypt(entity_id, entity_type, ciphertext, nonce).await?;
        String::from_utf8(plaintext)
            .map_err(|e| crate::shared::AppError::Encryption(format!("UTF-8 decode error: {}", e)))
    }
}

