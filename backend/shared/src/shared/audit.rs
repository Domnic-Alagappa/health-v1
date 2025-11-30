use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Audit fields that should be present on all database entities
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditFields {
    /// Request ID that created/updated this record
    pub request_id: Option<String>,
    
    /// Timestamp when the record was created
    pub created_at: DateTime<Utc>,
    
    /// Timestamp when the record was last updated
    pub updated_at: DateTime<Utc>,
    
    /// User ID who created this record
    pub created_by: Option<Uuid>,
    
    /// User ID who last updated this record
    pub updated_by: Option<Uuid>,
    
    /// System ID (for multi-system deployments)
    pub system_id: Option<String>,
    
    /// Version for optimistic locking
    pub version: i64,
}

impl Default for AuditFields {
    fn default() -> Self {
        let now = Utc::now();
        Self {
            request_id: None,
            created_at: now,
            updated_at: now,
            created_by: None,
            updated_by: None,
            system_id: None,
            version: 1,
        }
    }
}

impl AuditFields {
    /// Create new audit fields with default values
    pub fn new() -> Self {
        Self::default()
    }

    /// Create audit fields for a new record
    pub fn for_create(request_id: Option<String>, created_by: Option<Uuid>, system_id: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            request_id,
            created_at: now,
            updated_at: now,
            created_by,
            updated_by: created_by,
            system_id,
            version: 1,
        }
    }

    /// Update audit fields for an update operation
    pub fn touch(&mut self, request_id: Option<String>, updated_by: Option<Uuid>) {
        self.request_id = request_id;
        self.updated_at = Utc::now();
        self.updated_by = updated_by;
        self.version += 1;
    }

    /// Increment version for optimistic locking
    pub fn increment_version(&mut self) {
        self.version += 1;
        self.updated_at = Utc::now();
    }
}

/// Trait for entities that have audit fields
pub trait HasAuditFields {
    fn audit_fields(&self) -> &AuditFields;
    fn audit_fields_mut(&mut self) -> &mut AuditFields;
    
    /// Get request ID
    fn request_id(&self) -> Option<&String> {
        self.audit_fields().request_id.as_ref()
    }
    
    /// Get created timestamp
    fn created_at(&self) -> DateTime<Utc> {
        self.audit_fields().created_at
    }
    
    /// Get updated timestamp
    fn updated_at(&self) -> DateTime<Utc> {
        self.audit_fields().updated_at
    }
    
    /// Get creator user ID
    fn created_by(&self) -> Option<Uuid> {
        self.audit_fields().created_by
    }
    
    /// Get last updater user ID
    fn updated_by(&self) -> Option<Uuid> {
        self.audit_fields().updated_by
    }
    
    /// Get system ID
    fn system_id(&self) -> Option<&String> {
        self.audit_fields().system_id.as_ref()
    }
    
    /// Get version
    fn version(&self) -> i64 {
        self.audit_fields().version
    }
    
    /// Touch the record (update timestamp and version)
    fn touch(&mut self, request_id: Option<String>, updated_by: Option<Uuid>) {
        self.audit_fields_mut().touch(request_id, updated_by);
    }
}

/// Context for database operations with audit information
#[derive(Debug, Clone)]
pub struct AuditContext {
    pub request_id: Option<String>,
    pub user_id: Option<Uuid>,
    pub system_id: Option<String>,
}

impl AuditContext {
    pub fn new(request_id: Option<String>, user_id: Option<Uuid>, system_id: Option<String>) -> Self {
        Self {
            request_id,
            user_id,
            system_id,
        }
    }
    
    pub fn from_request_context(request_context: &crate::shared::RequestContext) -> Self {
        Self {
            request_id: Some(request_context.request_id.clone()),
            user_id: Some(request_context.user_id),
            system_id: None, // Could be extracted from request headers
        }
    }
}

