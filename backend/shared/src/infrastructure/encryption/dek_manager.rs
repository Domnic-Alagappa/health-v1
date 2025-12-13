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

    // ==========================================
    // Realm and Service DEK Isolation Methods
    // ==========================================

    /// Get DEK for a specific realm
    /// Each realm gets its own isolated DEK for cryptographic separation
    pub async fn get_realm_dek(&self, realm_id: &str, realm_uuid: Uuid) -> AppResult<Vec<u8>> {
        let entity_type = format!("realm/{}", realm_id);
        self.get_or_create_dek(realm_uuid, &entity_type).await
    }

    /// Get DEK for a specific service
    /// Each service gets its own isolated DEK for cryptographic separation
    pub async fn get_service_dek(&self, service_id: &str, service_uuid: Uuid) -> AppResult<Vec<u8>> {
        let entity_type = format!("service/{}", service_id);
        self.get_or_create_dek(service_uuid, &entity_type).await
    }

    /// Get DEK scoped to both realm and entity type
    /// For fine-grained isolation within a realm
    pub async fn get_scoped_dek(
        &self,
        realm_id: &str,
        entity_id: Uuid,
        entity_type: &str,
    ) -> AppResult<Vec<u8>> {
        let scoped_type = format!("realm/{}/{}", realm_id, entity_type);
        self.get_or_create_dek(entity_id, &scoped_type).await
    }

    /// Get DEK for a global scope (system-wide data)
    pub async fn get_global_dek(&self, scope_name: &str, scope_uuid: Uuid) -> AppResult<Vec<u8>> {
        let entity_type = format!("global/{}", scope_name);
        self.get_or_create_dek(scope_uuid, &entity_type).await
    }

    /// Get or create a DEK for an entity
    /// If DEK doesn't exist, creates a new one
    pub async fn get_or_create_dek(&self, entity_id: Uuid, entity_type: &str) -> AppResult<Vec<u8>> {
        // Try to get existing DEK
        if let Some(dek) = self.get_dek(entity_id, entity_type).await? {
            return Ok(dek);
        }

        // Generate new DEK if not exists
        self.generate_dek(entity_id, entity_type).await
    }

    // Note: DEK rotation should use the DekRotation service which handles
    // the full workflow including re-encrypting data. See dek_rotation.rs

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

    /// Encrypt DEK with master key and return separately (for database storage)
    pub async fn encrypt_dek_for_storage(
        &self,
        _entity_id: Uuid,
        _entity_type: &str,
        dek: &[u8],
    ) -> AppResult<(Vec<u8>, Vec<u8>)> {
        let cipher = Aes256Gcm::new_from_slice(self.master_key.key())
            .map_err(|e| crate::shared::AppError::Encryption(format!("Invalid master key: {}", e)))?;

        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        let ciphertext = cipher.encrypt(&nonce, dek)
            .map_err(|e| crate::shared::AppError::Encryption(format!("DEK encryption failed: {}", e)))?;

        Ok((ciphertext, nonce.to_vec()))
    }

    /// Encrypt DEK with master key (for vault storage - combined format)
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
    
    /// Encrypt a field value using entity's DEK
    /// Returns base64-encoded string with nonce prepended
    pub async fn encrypt_field(&self, entity_id: Uuid, entity_type: &str, field_value: &str) -> AppResult<String> {
        use base64::{Engine as _, engine::general_purpose::STANDARD};
        
        let data = field_value.as_bytes();
        let (ciphertext, nonce) = self.encrypt(entity_id, entity_type, data).await?;
        
        // Combine nonce and ciphertext, encode as base64
        let mut combined = nonce;
        combined.extend_from_slice(&ciphertext);
        Ok(STANDARD.encode(&combined))
    }
    
    /// Decrypt a field value using entity's DEK
    /// Expects base64-encoded string with nonce prepended
    pub async fn decrypt_field(&self, entity_id: Uuid, entity_type: &str, encrypted_value: &str) -> AppResult<String> {
        use base64::{Engine as _, engine::general_purpose::STANDARD};
        
        let combined = STANDARD.decode(encrypted_value)
            .map_err(|e| crate::shared::AppError::Encryption(format!("Base64 decode error: {}", e)))?;
        
        if combined.len() < 12 {
            return Err(crate::shared::AppError::Encryption("Invalid encrypted field format".to_string()));
        }

        let nonce = &combined[..12];
        let ciphertext = &combined[12..];
        
        let plaintext = self.decrypt(entity_id, entity_type, ciphertext, nonce).await?;
        String::from_utf8(plaintext)
            .map_err(|e| crate::shared::AppError::Encryption(format!("UTF-8 decode error: {}", e)))
    }
}

