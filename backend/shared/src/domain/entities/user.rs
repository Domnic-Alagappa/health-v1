use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use crate::shared::AuditFields;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub password_hash: String,
    pub is_active: bool,
    pub is_verified: bool,
    pub is_super_user: bool,
    pub organization_id: Option<Uuid>,
    pub last_login: Option<DateTime<Utc>>,
    // Audit fields
    pub request_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub system_id: Option<String>,
    pub version: i64,
}

impl User {
    pub fn new(email: String, username: String, password_hash: String) -> Self {
        let audit = AuditFields::new();
        Self {
            id: Uuid::new_v4(),
            email,
            username,
            password_hash,
            is_active: true,
            is_verified: false,
            is_super_user: false,
            organization_id: None,
            last_login: None,
            request_id: audit.request_id,
            created_at: audit.created_at,
            updated_at: audit.updated_at,
            created_by: audit.created_by,
            updated_by: audit.updated_by,
            system_id: audit.system_id,
            version: audit.version,
        }
    }
    
    pub fn new_super_user(email: String, username: String, password_hash: String) -> Self {
        let audit = AuditFields::new();
        Self {
            id: Uuid::new_v4(),
            email,
            username,
            password_hash,
            is_active: true,
            is_verified: true,
            is_super_user: true,
            organization_id: None,
            last_login: None,
            request_id: audit.request_id,
            created_at: audit.created_at,
            updated_at: audit.updated_at,
            created_by: audit.created_by,
            updated_by: audit.updated_by,
            system_id: audit.system_id,
            version: audit.version,
        }
    }

    pub fn verify(&mut self) {
        self.is_verified = true;
        self.updated_at = Utc::now();
        self.version += 1;
    }

    pub fn deactivate(&mut self) {
        self.is_active = false;
        self.updated_at = Utc::now();
        self.version += 1;
    }

    pub fn record_login(&mut self) {
        self.last_login = Some(Utc::now());
        self.updated_at = Utc::now();
        // Note: version is incremented by repository update() method for optimistic locking
    }
}

impl User {
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

