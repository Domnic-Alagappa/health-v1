use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Policy assignment - tracks which policy templates are applied to which users, groups, or roles
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PolicyAssignment {
    pub id: Uuid,
    pub policy_template_id: Uuid,
    pub target_type: String, // 'user', 'group', 'role'
    pub target_id: Uuid, // user_id, group_id, or role_id
    pub organization_id: Uuid, // Context for org-scoped policies
    pub applied_at: DateTime<Utc>,
    pub applied_by: Option<Uuid>,
    pub expires_at: Option<DateTime<Utc>>, // Optional: when this policy assignment expires
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

impl PolicyAssignment {
    pub fn new(
        policy_template_id: Uuid,
        target_type: String,
        target_id: Uuid,
        organization_id: Uuid,
        applied_by: Option<Uuid>,
        expires_at: Option<DateTime<Utc>>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            policy_template_id,
            target_type,
            target_id,
            organization_id,
            applied_at: now,
            applied_by,
            expires_at,
            created_at: now,
            updated_at: now,
            deleted_at: None,
            deleted_by: None,
            request_id: None,
            created_by: applied_by,
            updated_by: applied_by,
            system_id: None,
            version: 1,
        }
    }
    
    /// Check if assignment is expired
    pub fn is_expired(&self) -> bool {
        if let Some(expires_at) = self.expires_at {
            Utc::now() >= expires_at
        } else {
            false
        }
    }
    
    /// Check if assignment is deleted
    pub fn is_deleted(&self) -> bool {
        self.deleted_at.is_some()
    }
    
    /// Check if assignment is valid (not deleted and not expired)
    pub fn is_valid(&self) -> bool {
        !self.is_deleted() && !self.is_expired()
    }
    
    /// Soft delete policy assignment
    pub fn soft_delete(&mut self, deleted_by: Option<Uuid>) {
        self.deleted_at = Some(Utc::now());
        self.deleted_by = deleted_by;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Restore soft-deleted policy assignment
    pub fn restore(&mut self) {
        self.deleted_at = None;
        self.deleted_by = None;
        self.updated_at = Utc::now();
        self.version += 1;
    }
    
    /// Extend expiration
    pub fn extend_expiration(&mut self, new_expires_at: DateTime<Utc>) {
        self.expires_at = Some(new_expires_at);
        self.updated_at = Utc::now();
        self.version += 1;
    }
}

