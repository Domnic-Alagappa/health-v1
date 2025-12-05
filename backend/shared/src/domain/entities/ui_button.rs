use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json::Value;

/// UI Button entity - represents a button in the admin UI
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct UiButton {
    pub id: Uuid,
    pub page_id: Uuid,
    pub button_id: String,
    pub label: String,
    pub action: Option<String>,
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

impl UiButton {
    pub fn new(page_id: Uuid, button_id: String, label: String, action: Option<String>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            page_id,
            button_id,
            label,
            action,
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
    
    /// Get Zanzibar resource string for this button
    /// Format: button:{button_id}
    pub fn to_zanzibar_resource(&self) -> String {
        format!("button:{}", self.button_id)
    }
    
    /// Soft delete button
    pub fn soft_delete(&mut self, deleted_by: Option<Uuid>) {
        self.deleted_at = Some(Utc::now());
        self.deleted_by = deleted_by;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Restore soft-deleted button
    pub fn restore(&mut self) {
        self.deleted_at = None;
        self.deleted_by = None;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Check if button is deleted
    pub fn is_deleted(&self) -> bool {
        self.deleted_at.is_some()
    }
    
    /// Update metadata
    pub fn set_metadata(&mut self, metadata: Value) {
        self.metadata = metadata;
        self.updated_at = Utc::now();
        self.version += 1;
    }
}

