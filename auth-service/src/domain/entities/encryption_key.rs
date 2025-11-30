use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Data Encryption Key (DEK) entity
/// Each user/entity has an individual DEK encrypted with the master key
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EncryptionKey {
    pub id: Uuid,
    pub entity_id: Uuid,           // User or entity this key belongs to
    pub entity_type: String,       // "user", "patient", "document", etc.
    pub encrypted_key: Vec<u8>,     // DEK encrypted with master key
    pub nonce: Vec<u8>,             // Nonce used for AES-256-GCM encryption (12 bytes)
    pub key_algorithm: String,      // "AES-256-GCM"
    pub created_at: DateTime<Utc>,
    pub rotated_at: Option<DateTime<Utc>>,
    pub is_active: bool,
    // Audit fields
    pub request_id: Option<String>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub system_id: Option<String>,
    pub version: i64,
}

impl EncryptionKey {
    pub fn new(
        entity_id: Uuid,
        entity_type: String,
        encrypted_key: Vec<u8>,
        nonce: Vec<u8>,
        key_algorithm: String,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            entity_id,
            entity_type,
            encrypted_key,
            nonce,
            key_algorithm,
            created_at: now,
            rotated_at: None,
            is_active: true,
            request_id: None,
            updated_at: now,
            created_by: None,
            updated_by: None,
            system_id: None,
            version: 1,
        }
    }

    pub fn rotate(&mut self, new_encrypted_key: Vec<u8>, new_nonce: Vec<u8>) {
        self.encrypted_key = new_encrypted_key;
        self.nonce = new_nonce;
        self.rotated_at = Some(Utc::now());
        self.updated_at = Utc::now();
        self.is_active = true;
        self.version += 1;
    }

    pub fn deactivate(&mut self) {
        self.is_active = false;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Touch the record (update audit fields)
    pub fn touch(&mut self, request_id: Option<String>, updated_by: Option<Uuid>) {
        self.request_id = request_id;
        self.updated_at = Utc::now();
        self.updated_by = updated_by;
        self.version += 1;
    }
    
    /// Set audit fields for create operation
    pub fn set_audit_create(&mut self, request_id: Option<String>, created_by: Option<Uuid>, system_id: Option<String>) {
        let now = Utc::now();
        self.request_id = request_id;
        self.created_at = now;
        self.updated_at = now;
        self.created_by = created_by;
        self.updated_by = created_by;
        self.system_id = system_id;
        self.version = 1;
    }
}

