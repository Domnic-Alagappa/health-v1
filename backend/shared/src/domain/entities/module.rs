use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json::Value;

/// Module entity - represents a feature/functionality within an app
/// Example: "users" module in "admin-ui" app
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Module {
    pub id: Uuid,
    pub name: String, // e.g., "users", "patients", "clinical"
    pub app_name: String, // e.g., "admin-ui", "client-app"
    pub organization_id: Option<Uuid>, // NULL for global modules
    pub description: Option<String>,
    pub metadata: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    // Soft delete
    pub deleted_at: Option<DateTime<Utc>>,
    pub deleted_by: Option<Uuid>,
    // Audit fields
    pub request_id: Option<String>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub system_id: Option<String>,
    pub version: i64,
}

impl Module {
    pub fn new(
        name: String,
        app_name: String,
        organization_id: Option<Uuid>,
        description: Option<String>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            name,
            app_name,
            organization_id,
            description,
            metadata: Value::Object(serde_json::Map::new()),
            created_at: now,
            updated_at: now,
            deleted_at: None,
            deleted_by: None,
            request_id: None,
            created_by: None,
            updated_by: None,
            system_id: None,
            version: 1,
        }
    }
    
    /// Get Zanzibar resource string for this module
    /// Format: organization:{org_id}/app:{app_name}/module:{name}
    pub fn to_zanzibar_resource(&self) -> String {
        if let Some(org_id) = self.organization_id {
            format!("organization:{}/app:{}/module:{}", org_id, self.app_name, self.name)
        } else {
            format!("app:{}/module:{}", self.app_name, self.name)
        }
    }
    
    /// Check if module is deleted
    pub fn is_deleted(&self) -> bool {
        self.deleted_at.is_some()
    }
    
    /// Soft delete module
    pub fn soft_delete(&mut self, deleted_by: Option<Uuid>) {
        self.deleted_at = Some(Utc::now());
        self.deleted_by = deleted_by;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Restore soft-deleted module
    pub fn restore(&mut self) {
        self.deleted_at = None;
        self.deleted_by = None;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Update metadata
    pub fn set_metadata(&mut self, metadata: Value) {
        self.metadata = metadata;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Set audit fields for create operation
    pub fn set_audit_create(
        &mut self,
        request_id: Option<String>,
        created_by: Option<Uuid>,
        system_id: Option<String>,
    ) {
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

