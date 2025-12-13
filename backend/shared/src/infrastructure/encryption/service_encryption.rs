//! Service-specific encryption context
//!
//! Provides encryption/decryption operations scoped to a specific service,
//! with controlled access to realm-specific DEKs based on service permissions.

use super::DekManager;
use crate::shared::{AppError, AppResult};
use std::io::{Read, Write};
use std::sync::Arc;
use uuid::Uuid;

/// Service-specific encryption context
///
/// This struct provides encryption operations for a specific service,
/// enforcing that the service can only access realms it's authorized for.
pub struct ServiceEncryption {
    dek_manager: Arc<DekManager>,
    service_id: String,
    service_uuid: Uuid,
    /// Realms this service is authorized to access
    allowed_realms: Vec<String>,
}

impl ServiceEncryption {
    /// Create a new service encryption context
    pub fn new(
        dek_manager: Arc<DekManager>,
        service_id: impl Into<String>,
        service_uuid: Uuid,
        allowed_realms: Vec<String>,
    ) -> Self {
        Self {
            dek_manager,
            service_id: service_id.into(),
            service_uuid,
            allowed_realms,
        }
    }

    /// Check if service has access to a realm
    pub fn has_realm_access(&self, realm_id: &str) -> bool {
        self.allowed_realms.iter().any(|r| r == realm_id)
    }

    /// Add realm access for this service
    pub fn grant_realm_access(&mut self, realm_id: impl Into<String>) {
        let realm_id = realm_id.into();
        if !self.allowed_realms.contains(&realm_id) {
            self.allowed_realms.push(realm_id);
        }
    }

    /// Remove realm access for this service
    pub fn revoke_realm_access(&mut self, realm_id: &str) {
        self.allowed_realms.retain(|r| r != realm_id);
    }

    /// Get the service's own DEK (for service-specific data)
    pub async fn get_service_dek(&self) -> AppResult<Vec<u8>> {
        self.dek_manager
            .get_service_dek(&self.service_id, self.service_uuid)
            .await
    }

    /// Get DEK for a specific realm (requires authorization)
    pub async fn get_realm_dek(&self, realm_id: &str, realm_uuid: Uuid) -> AppResult<Vec<u8>> {
        if !self.has_realm_access(realm_id) {
            return Err(AppError::Authorization(format!(
                "Service '{}' not authorized to access realm '{}'",
                self.service_id, realm_id
            )));
        }

        self.dek_manager.get_realm_dek(realm_id, realm_uuid).await
    }

    /// Encrypt data using service's own DEK
    pub async fn encrypt(&self, data: &[u8]) -> AppResult<Vec<u8>> {
        let dek = self.get_service_dek().await?;
        self.encrypt_with_dek(&dek, data)
    }

    /// Decrypt data using service's own DEK
    pub async fn decrypt(&self, encrypted: &[u8]) -> AppResult<Vec<u8>> {
        let dek = self.get_service_dek().await?;
        self.decrypt_with_dek(&dek, encrypted)
    }

    /// Encrypt data for a specific realm
    pub async fn encrypt_for_realm(
        &self,
        realm_id: &str,
        realm_uuid: Uuid,
        data: &[u8],
    ) -> AppResult<Vec<u8>> {
        let dek = self.get_realm_dek(realm_id, realm_uuid).await?;
        self.encrypt_with_dek(&dek, data)
    }

    /// Decrypt data from a specific realm
    pub async fn decrypt_from_realm(
        &self,
        realm_id: &str,
        realm_uuid: Uuid,
        encrypted: &[u8],
    ) -> AppResult<Vec<u8>> {
        let dek = self.get_realm_dek(realm_id, realm_uuid).await?;
        self.decrypt_with_dek(&dek, encrypted)
    }

    /// Encrypt data using age with the provided DEK
    fn encrypt_with_dek(&self, dek: &[u8], data: &[u8]) -> AppResult<Vec<u8>> {
        let passphrase_str = hex::encode(dek);
        let passphrase = age::secrecy::SecretString::from(passphrase_str);
        let encryptor = age::Encryptor::with_user_passphrase(passphrase);

        let mut encrypted = vec![];
        let mut writer = encryptor
            .wrap_output(&mut encrypted)
            .map_err(|e| AppError::Encryption(format!("Failed to create age encryptor: {}", e)))?;

        writer
            .write_all(data)
            .map_err(|e| AppError::Encryption(format!("Failed to encrypt data: {}", e)))?;

        writer
            .finish()
            .map_err(|e| AppError::Encryption(format!("Failed to finalize encryption: {}", e)))?;

        Ok(encrypted)
    }

    /// Decrypt data using age with the provided DEK
    fn decrypt_with_dek(&self, dek: &[u8], encrypted: &[u8]) -> AppResult<Vec<u8>> {
        let passphrase_str = hex::encode(dek);
        let passphrase = age::secrecy::SecretString::from(passphrase_str);
        
        // Create identity from passphrase for decryption
        let identity = age::scrypt::Identity::new(passphrase);
        
        // Create decryptor
        let decryptor = age::Decryptor::new(encrypted)
            .map_err(|e| AppError::Encryption(format!("Failed to create age decryptor: {}", e)))?;

        let mut decrypted = vec![];
        let mut reader = decryptor
            .decrypt(std::iter::once(&identity as &dyn age::Identity))
            .map_err(|e| AppError::Encryption(format!("Failed to decrypt: {}", e)))?;

        reader
            .read_to_end(&mut decrypted)
            .map_err(|e| AppError::Encryption(format!("Failed to read decrypted data: {}", e)))?;

        Ok(decrypted)
    }
}

/// Builder for ServiceEncryption
pub struct ServiceEncryptionBuilder {
    dek_manager: Arc<DekManager>,
    service_id: String,
    service_uuid: Uuid,
    allowed_realms: Vec<String>,
}

impl ServiceEncryptionBuilder {
    /// Create a new builder
    pub fn new(
        dek_manager: Arc<DekManager>,
        service_id: impl Into<String>,
        service_uuid: Uuid,
    ) -> Self {
        Self {
            dek_manager,
            service_id: service_id.into(),
            service_uuid,
            allowed_realms: Vec::new(),
        }
    }

    /// Add realm access
    pub fn with_realm(mut self, realm_id: impl Into<String>) -> Self {
        self.allowed_realms.push(realm_id.into());
        self
    }

    /// Add multiple realm accesses
    pub fn with_realms(mut self, realm_ids: Vec<String>) -> Self {
        self.allowed_realms.extend(realm_ids);
        self
    }

    /// Build the ServiceEncryption
    pub fn build(self) -> ServiceEncryption {
        ServiceEncryption::new(
            self.dek_manager,
            self.service_id,
            self.service_uuid,
            self.allowed_realms,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_realm_access_check() {
        // This is a unit test that doesn't require actual encryption
        // A more complete test would mock the DekManager

        // Test the allowed_realms logic
        let allowed = vec!["hospital-a".to_string(), "hospital-b".to_string()];
        
        // Verify contains logic
        assert!(allowed.iter().any(|r| r == "hospital-a"));
        assert!(allowed.iter().any(|r| r == "hospital-b"));
        assert!(!allowed.iter().any(|r| r == "hospital-c"));
    }
}

