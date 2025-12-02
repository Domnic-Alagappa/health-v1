use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json::Value;

/// Policy template - reusable permission policy that can be applied to users, groups, or roles
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PolicyTemplate {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub organization_id: Option<Uuid>, // NULL for global policies
    pub app_name: Option<String>, // Optional: scoped to specific app
    pub module_name: Option<String>, // Optional: scoped to specific module
    pub policy_definition: Value, // JSONB: Array of relationship templates with placeholders
    pub applicable_to: Vec<String>, // ['user', 'group', 'role']
    pub is_active: bool,
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

impl PolicyTemplate {
    pub fn new(
        name: String,
        description: Option<String>,
        organization_id: Option<Uuid>,
        app_name: Option<String>,
        module_name: Option<String>,
        policy_definition: Value,
        applicable_to: Vec<String>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            name,
            description,
            organization_id,
            app_name,
            module_name,
            policy_definition,
            applicable_to,
            is_active: true,
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
    
    /// Check if policy template is deleted
    pub fn is_deleted(&self) -> bool {
        self.deleted_at.is_some()
    }
    
    /// Soft delete policy template
    pub fn soft_delete(&mut self, deleted_by: Option<Uuid>) {
        self.deleted_at = Some(Utc::now());
        self.deleted_by = deleted_by;
        self.is_active = false;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Restore soft-deleted policy template
    pub fn restore(&mut self) {
        self.deleted_at = None;
        self.deleted_by = None;
        self.is_active = true;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Deactivate policy template
    pub fn deactivate(&mut self) {
        self.is_active = false;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Activate policy template
    pub fn activate(&mut self) {
        self.is_active = true;
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

