use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Role {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub permissions: Vec<Uuid>, // Permission IDs
    // Audit fields
    pub request_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub system_id: Option<String>,
    pub version: i64,
}

impl Role {
    pub fn new(name: String, description: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            name,
            description,
            permissions: Vec::new(),
            request_id: None,
            created_at: now,
            updated_at: now,
            created_by: None,
            updated_by: None,
            system_id: None,
            version: 1,
        }
    }

    pub fn add_permission(&mut self, permission_id: Uuid) {
        if !self.permissions.contains(&permission_id) {
            self.permissions.push(permission_id);
            self.updated_at = Utc::now();
            self.version += 1;
        }
    }

    pub fn remove_permission(&mut self, permission_id: Uuid) {
        self.permissions.retain(|&id| id != permission_id);
        self.updated_at = Utc::now();
        self.version += 1;
    }

    pub fn has_permission(&self, permission_id: Uuid) -> bool {
        self.permissions.contains(&permission_id)
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

