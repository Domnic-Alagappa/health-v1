//! Encrypted local filesystem storage using age encryption with per-realm/service DEKs
//!
//! This module provides a storage implementation that encrypts all data at rest using
//! age encryption with Data Encryption Keys (DEKs) managed by RustyVault. Each realm
//! or service gets its own DEK, providing cryptographic isolation between tenants.

use crate::infrastructure::encryption::DekManager;
use crate::infrastructure::storage::storage_trait::Storage;
use crate::shared::{AppError, AppResult};
use async_trait::async_trait;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::fs;
use uuid::Uuid;

// Use age's secrecy types
use age::secrecy::ExposeSecret;

/// Scope for encrypted storage - determines which DEK to use
#[derive(Debug, Clone)]
pub enum EncryptionScope {
    /// Realm-scoped storage - uses realm-specific DEK
    Realm {
        realm_id: String,
        realm_uuid: Uuid,
    },
    /// Service-scoped storage - uses service-specific DEK
    Service {
        service_id: String,
        service_uuid: Uuid,
    },
    /// Global scope - uses a global DEK (for system data)
    Global {
        scope_name: String,
        scope_uuid: Uuid,
    },
}

impl EncryptionScope {
    /// Create a realm scope
    pub fn realm(realm_id: impl Into<String>, realm_uuid: Uuid) -> Self {
        Self::Realm {
            realm_id: realm_id.into(),
            realm_uuid,
        }
    }

    /// Create a service scope
    pub fn service(service_id: impl Into<String>, service_uuid: Uuid) -> Self {
        Self::Service {
            service_id: service_id.into(),
            service_uuid,
        }
    }

    /// Create a global scope
    pub fn global(scope_name: impl Into<String>, scope_uuid: Uuid) -> Self {
        Self::Global {
            scope_name: scope_name.into(),
            scope_uuid,
        }
    }

    /// Get the entity type for DEK management
    fn entity_type(&self) -> String {
        match self {
            Self::Realm { realm_id, .. } => format!("realm/{}", realm_id),
            Self::Service { service_id, .. } => format!("service/{}", service_id),
            Self::Global { scope_name, .. } => format!("global/{}", scope_name),
        }
    }

    /// Get the entity UUID for DEK management
    fn entity_uuid(&self) -> Uuid {
        match self {
            Self::Realm { realm_uuid, .. } => *realm_uuid,
            Self::Service { service_uuid, .. } => *service_uuid,
            Self::Global { scope_uuid, .. } => *scope_uuid,
        }
    }

    /// Get the subdirectory path for this scope
    fn subpath(&self) -> PathBuf {
        match self {
            Self::Realm { realm_id, .. } => PathBuf::from("realms").join(realm_id),
            Self::Service { service_id, .. } => PathBuf::from("services").join(service_id),
            Self::Global { scope_name, .. } => PathBuf::from("global").join(scope_name),
        }
    }
}

/// Encrypted local filesystem storage with per-realm/service DEK isolation
///
/// This storage implementation:
/// - Encrypts all files using age encryption
/// - Uses separate DEKs for each realm/service (cryptographic isolation)
/// - Stores files in scope-specific directories (physical isolation)
/// - DEKs are encrypted with the master key and stored in RustyVault
pub struct EncryptedLocalFsStorage {
    base_path: PathBuf,
    dek_manager: Arc<DekManager>,
    scope: EncryptionScope,
}

impl EncryptedLocalFsStorage {
    /// Create new encrypted storage with a specific scope
    pub fn new(base_path: impl Into<PathBuf>, dek_manager: Arc<DekManager>, scope: EncryptionScope) -> Self {
        let base = base_path.into();
        Self {
            base_path: base.join(scope.subpath()),
            dek_manager,
            scope,
        }
    }

    /// Create realm-scoped storage
    pub fn for_realm(
        base_path: impl Into<PathBuf>,
        dek_manager: Arc<DekManager>,
        realm_id: impl Into<String>,
        realm_uuid: Uuid,
    ) -> Self {
        Self::new(base_path, dek_manager, EncryptionScope::realm(realm_id, realm_uuid))
    }

    /// Create service-scoped storage
    pub fn for_service(
        base_path: impl Into<PathBuf>,
        dek_manager: Arc<DekManager>,
        service_id: impl Into<String>,
        service_uuid: Uuid,
    ) -> Self {
        Self::new(base_path, dek_manager, EncryptionScope::service(service_id, service_uuid))
    }

    /// Create global-scoped storage
    pub fn for_global(
        base_path: impl Into<PathBuf>,
        dek_manager: Arc<DekManager>,
        scope_name: impl Into<String>,
        scope_uuid: Uuid,
    ) -> Self {
        Self::new(base_path, dek_manager, EncryptionScope::global(scope_name, scope_uuid))
    }

    /// Get the full path for a key
    fn get_path(&self, key: &str) -> PathBuf {
        // Add .age extension to indicate encrypted file
        self.base_path.join(format!("{}.age", key))
    }

    /// Get or create the DEK for this scope
    async fn get_or_create_dek(&self) -> AppResult<Vec<u8>> {
        let entity_uuid = self.scope.entity_uuid();
        let entity_type = self.scope.entity_type();

        // Try to get existing DEK
        if let Some(dek) = self.dek_manager.get_dek(entity_uuid, &entity_type).await? {
            return Ok(dek);
        }

        // Generate new DEK if not exists
        self.dek_manager.generate_dek(entity_uuid, &entity_type).await
    }

    /// Encrypt data using age with the scope's DEK
    fn encrypt_with_dek(&self, dek: &[u8], data: &[u8]) -> AppResult<Vec<u8>> {
        // Convert DEK to hex string for age passphrase
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

    /// Decrypt data using age with the scope's DEK
    fn decrypt_with_dek(&self, dek: &[u8], encrypted: &[u8]) -> AppResult<Vec<u8>> {
        // Convert DEK to hex string for age passphrase
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

#[async_trait]
impl Storage for EncryptedLocalFsStorage {
    async fn put(&self, key: &str, data: &[u8]) -> AppResult<()> {
        let path = self.get_path(key);

        // Create parent directories if needed
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .await
                .map_err(|e| AppError::Storage(format!("Failed to create directory: {}", e)))?;
        }

        // Get or create DEK for this scope
        let dek = self.get_or_create_dek().await?;

        // Encrypt data with age
        let encrypted = self.encrypt_with_dek(&dek, data)?;

        // Write encrypted data
        fs::write(&path, encrypted)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to write file: {}", e)))?;

        Ok(())
    }

    async fn get(&self, key: &str) -> AppResult<Option<Vec<u8>>> {
        let path = self.get_path(key);

        // Read encrypted data
        let encrypted = match fs::read(&path).await {
            Ok(data) => data,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(None),
            Err(e) => return Err(AppError::Storage(format!("Failed to read file: {}", e))),
        };

        // Get DEK for this scope (must exist if file exists)
        let dek = self.get_or_create_dek().await?;

        // Decrypt data
        let decrypted = self.decrypt_with_dek(&dek, &encrypted)?;

        Ok(Some(decrypted))
    }

    async fn delete(&self, key: &str) -> AppResult<()> {
        let path = self.get_path(key);
        fs::remove_file(&path)
            .await
            .map_err(|e| AppError::Storage(format!("Failed to delete file: {}", e)))?;
        Ok(())
    }

    async fn list(&self, prefix: &str) -> AppResult<Vec<String>> {
        let prefix_path = if prefix.is_empty() {
            self.base_path.clone()
        } else {
            self.base_path.join(prefix)
        };

        let mut keys = Vec::new();

        if !prefix_path.exists() {
            return Ok(keys);
        }

        if prefix_path.is_dir() {
            let mut entries = fs::read_dir(&prefix_path)
                .await
                .map_err(|e| AppError::Storage(format!("Failed to read directory: {}", e)))?;

            while let Some(entry) = entries
                .next_entry()
                .await
                .map_err(|e| AppError::Storage(format!("Failed to read entry: {}", e)))?
            {
                if let Some(file_name) = entry.file_name().to_str() {
                    // Strip .age extension from listed keys
                    let key_name = file_name.strip_suffix(".age").unwrap_or(file_name);
                    if prefix.is_empty() {
                        keys.push(key_name.to_string());
                    } else {
                        keys.push(format!("{}/{}", prefix, key_name));
                    }
                }
            }
        }

        Ok(keys)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Note: Full tests require a mock DekManager
    // These are placeholder tests

    #[test]
    fn test_encryption_scope_entity_type() {
        let realm_scope = EncryptionScope::realm("hospital-a", Uuid::new_v4());
        assert!(realm_scope.entity_type().starts_with("realm/"));

        let service_scope = EncryptionScope::service("lab-system", Uuid::new_v4());
        assert!(service_scope.entity_type().starts_with("service/"));

        let global_scope = EncryptionScope::global("system", Uuid::new_v4());
        assert!(global_scope.entity_type().starts_with("global/"));
    }

    #[test]
    fn test_encryption_scope_subpath() {
        let realm_scope = EncryptionScope::realm("hospital-a", Uuid::new_v4());
        assert_eq!(realm_scope.subpath(), PathBuf::from("realms/hospital-a"));

        let service_scope = EncryptionScope::service("lab-system", Uuid::new_v4());
        assert_eq!(service_scope.subpath(), PathBuf::from("services/lab-system"));
    }
}

