use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Data Encryption Key (DEK) entity
/// Each user/entity has an individual DEK encrypted with the master key
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EncryptionKey {
    pub id: Uuid,
    pub entity_id: Uuid,           // User or entity this key belongs to
    pub entity_type: String,       // "user", "patient", "document", etc.
    pub encrypted_key: Vec<u8>,     // DEK encrypted with master key
    pub key_algorithm: String,      // "AES-256-GCM"
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub rotated_at: Option<chrono::DateTime<chrono::Utc>>,
    pub is_active: bool,
}

impl EncryptionKey {
    pub fn new(
        entity_id: Uuid,
        entity_type: String,
        encrypted_key: Vec<u8>,
        key_algorithm: String,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            entity_id,
            entity_type,
            encrypted_key,
            key_algorithm,
            created_at: chrono::Utc::now(),
            rotated_at: None,
            is_active: true,
        }
    }

    pub fn rotate(&mut self, new_encrypted_key: Vec<u8>) {
        self.encrypted_key = new_encrypted_key;
        self.rotated_at = Some(chrono::Utc::now());
        self.is_active = true;
    }

    pub fn deactivate(&mut self) {
        self.is_active = false;
    }
}

