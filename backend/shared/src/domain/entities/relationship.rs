use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json::Value;

/// Zanzibar-style relationship tuple
/// Format: user:123#member@group:456
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash, FromRow)]
pub struct Relationship {
    pub id: Uuid,
    pub user: String,        // user:123
    pub relation: String,    // member
    pub object: String,      // group:456
    pub created_at: DateTime<Utc>,
    // Time-bound fields
    pub valid_from: Option<DateTime<Utc>>,      // When permission becomes valid
    pub expires_at: Option<DateTime<Utc>>,      // When permission expires
    pub is_active: bool,                        // Can be revoked without deletion
    // Metadata for extensibility (can be encrypted with user's DEK)
    pub metadata: Value,                        // Store custom data: {"reason": "...", "granted_by": "..."}
    // Soft delete
    pub deleted_at: Option<DateTime<Utc>>,
    pub deleted_by: Option<Uuid>,
    // Audit fields
    pub request_id: Option<String>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub system_id: Option<String>,
    pub version: i64,
}

impl Relationship {
    pub fn new(user: String, relation: String, object: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            user,
            relation,
            object,
            created_at: now,
            valid_from: Some(now),
            expires_at: None,
            is_active: true,
            metadata: Value::Object(serde_json::Map::new()),
            deleted_at: None,
            deleted_by: None,
            request_id: None,
            updated_at: now,
            created_by: None,
            updated_by: None,
            system_id: None,
            version: 1,
        }
    }
    
    /// Create time-bound relationship
    pub fn new_with_expiration(
        user: String,
        relation: String,
        object: String,
        expires_at: DateTime<Utc>,
    ) -> Self {
        let mut rel = Self::new(user, relation, object);
        rel.expires_at = Some(expires_at);
        rel
    }
    
    /// Create relationship with validity window
    pub fn new_with_validity(
        user: String,
        relation: String,
        object: String,
        valid_from: DateTime<Utc>,
        expires_at: Option<DateTime<Utc>>,
    ) -> Self {
        let mut rel = Self::new(user, relation, object);
        rel.valid_from = Some(valid_from);
        rel.expires_at = expires_at;
        rel
    }
    
    /// Check if relationship is currently valid
    pub fn is_valid(&self) -> bool {
        // Check soft delete
        if self.deleted_at.is_some() {
            return false;
        }
        
        // Check active status
        if !self.is_active {
            return false;
        }
        
        let now = Utc::now();
        
        // Check valid_from
        if let Some(valid_from) = self.valid_from {
            if now < valid_from {
                return false;
            }
        }
        
        // Check expires_at
        if let Some(expires_at) = self.expires_at {
            if now >= expires_at {
                return false;
            }
        }
        
        true
    }
    
    /// Revoke relationship (soft delete)
    pub fn revoke(&mut self, revoked_by: Option<Uuid>) {
        self.is_active = false;
        self.deleted_at = Some(Utc::now());
        self.deleted_by = revoked_by;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Soft delete relationship
    pub fn soft_delete(&mut self, deleted_by: Option<Uuid>) {
        self.deleted_at = Some(Utc::now());
        self.deleted_by = deleted_by;
        self.is_active = false;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Restore soft-deleted relationship
    pub fn restore(&mut self) {
        self.deleted_at = None;
        self.deleted_by = None;
        self.is_active = true;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Extend expiration
    pub fn extend_expiration(&mut self, new_expires_at: DateTime<Utc>) {
        self.expires_at = Some(new_expires_at);
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Encrypt sensitive metadata using user's DEK
    /// Note: This requires DekManager and user_id, so it's async
    /// The actual encryption will be done in the service layer
    pub fn set_metadata(&mut self, metadata: Value, encrypt: bool) {
        if encrypt {
            // Mark metadata as needing encryption
            // Actual encryption happens in service layer with DEK
            self.metadata = serde_json::json!({
                "_encrypted": true,
                "_needs_encryption": true,
                "data": metadata
            });
        } else {
            self.metadata = metadata;
        }
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Check if metadata is encrypted
    pub fn is_metadata_encrypted(&self) -> bool {
        self.metadata.get("_encrypted")
            .and_then(|v| v.as_bool())
            .unwrap_or(false)
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

    /// Format as Zanzibar tuple string: user:123#member@group:456
    pub fn to_tuple_string(&self) -> String {
        format!("{}#{}@{}", self.user, self.relation, self.object)
    }

    /// Parse from tuple string
    pub fn from_tuple_string(tuple: &str) -> Result<Self, String> {
        let parts: Vec<&str> = tuple.split('#').collect();
        if parts.len() != 2 {
            return Err("Invalid tuple format".to_string());
        }

        let user = parts[0].to_string();
        let relation_object: Vec<&str> = parts[1].split('@').collect();
        if relation_object.len() != 2 {
            return Err("Invalid tuple format".to_string());
        }

        let relation = relation_object[0].to_string();
        let object = relation_object[1].to_string();

        Ok(Self::new(user, relation, object))
    }
}

