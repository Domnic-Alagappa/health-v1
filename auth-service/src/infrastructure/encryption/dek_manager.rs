use crate::infrastructure::encryption::{MasterKey, Vault};
use crate::shared::AppResult;
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use uuid::Uuid;

pub struct DekManager {
    master_key: MasterKey,
    vault: Box<dyn Vault>,
}

impl DekManager {
    pub fn new(master_key: MasterKey, vault: Box<dyn Vault>) -> Self {
        Self { master_key, vault }
    }

    /// Generate a new DEK for an entity
    pub async fn generate_dek(&self, entity_id: Uuid, entity_type: &str) -> AppResult<Vec<u8>> {
        // Generate random 256-bit DEK
        let dek = Aes256Gcm::generate_key(&mut OsRng);
        let dek_bytes = dek.as_slice().to_vec();

        // Encrypt DEK with master key
        let encrypted_dek = self.encrypt_dek(&dek_bytes)?;

        // Store encrypted DEK in vault
        self.vault
            .store_dek(&entity_id.to_string(), entity_type, &encrypted_dek)
            .await?;

        Ok(dek_bytes)
    }

    /// Get DEK for an entity (decrypts from vault)
    pub async fn get_dek(&self, entity_id: Uuid, entity_type: &str) -> AppResult<Option<Vec<u8>>> {
        // Retrieve encrypted DEK from vault
        let encrypted_dek = self.vault
            .get_dek(&entity_id.to_string(), entity_type)
            .await?;

        if let Some(encrypted) = encrypted_dek {
            // Decrypt DEK with master key
            let dek = self.decrypt_dek(&encrypted)?;
            Ok(Some(dek))
        } else {
            Ok(None)
        }
    }

    /// Encrypt data using entity's DEK
    pub async fn encrypt(&self, entity_id: Uuid, entity_type: &str, data: &[u8]) -> AppResult<(Vec<u8>, Vec<u8>)> {
        let dek = self.get_dek(entity_id, entity_type).await?
            .ok_or_else(|| crate::shared::AppError::Encryption("DEK not found".to_string()))?;

        let cipher = Aes256Gcm::new_from_slice(&dek)
            .map_err(|e| crate::shared::AppError::Encryption(format!("Invalid DEK: {}", e)))?;

        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        let ciphertext = cipher.encrypt(&nonce, data)
            .map_err(|e| crate::shared::AppError::Encryption(format!("Encryption failed: {}", e)))?;

        Ok((ciphertext, nonce.to_vec()))
    }

    /// Decrypt data using entity's DEK
    pub async fn decrypt(&self, entity_id: Uuid, entity_type: &str, ciphertext: &[u8], nonce: &[u8]) -> AppResult<Vec<u8>> {
        let dek = self.get_dek(entity_id, entity_type).await?
            .ok_or_else(|| crate::shared::AppError::Encryption("DEK not found".to_string()))?;

        let cipher = Aes256Gcm::new_from_slice(&dek)
            .map_err(|e| crate::shared::AppError::Encryption(format!("Invalid DEK: {}", e)))?;

        let nonce = Nonce::from_slice(nonce);
        let plaintext = cipher.decrypt(nonce, ciphertext)
            .map_err(|e| crate::shared::AppError::Encryption(format!("Decryption failed: {}", e)))?;

        Ok(plaintext)
    }

    /// Encrypt DEK with master key
    fn encrypt_dek(&self, dek: &[u8]) -> AppResult<Vec<u8>> {
        let cipher = Aes256Gcm::new_from_slice(self.master_key.key())
            .map_err(|e| crate::shared::AppError::Encryption(format!("Invalid master key: {}", e)))?;

        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        let ciphertext = cipher.encrypt(&nonce, dek)
            .map_err(|e| crate::shared::AppError::Encryption(format!("DEK encryption failed: {}", e)))?;

        // Prepend nonce to ciphertext
        let mut result = nonce.to_vec();
        result.extend_from_slice(&ciphertext);
        Ok(result)
    }

    /// Decrypt DEK with master key
    fn decrypt_dek(&self, encrypted_dek: &[u8]) -> AppResult<Vec<u8>> {
        if encrypted_dek.len() < 12 {
            return Err(crate::shared::AppError::Encryption("Invalid encrypted DEK format".to_string()));
        }

        let nonce = Nonce::from_slice(&encrypted_dek[..12]);
        let ciphertext = &encrypted_dek[12..];

        let cipher = Aes256Gcm::new_from_slice(self.master_key.key())
            .map_err(|e| crate::shared::AppError::Encryption(format!("Invalid master key: {}", e)))?;

        let dek = cipher.decrypt(nonce, ciphertext)
            .map_err(|e| crate::shared::AppError::Encryption(format!("DEK decryption failed: {}", e)))?;

        Ok(dek)
    }
}

