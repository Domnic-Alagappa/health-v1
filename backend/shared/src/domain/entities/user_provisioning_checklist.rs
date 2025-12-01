use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};

/// Checklist item status
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum ChecklistItemStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
}

/// Individual checklist item
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChecklistItem {
    pub id: String,
    pub description: String,
    pub status: ChecklistItemStatus,
    pub error: Option<String>,
    pub completed_at: Option<DateTime<Utc>>,
}

/// User provisioning checklist
/// Tracks all steps required when creating a new user
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserProvisioningChecklist {
    pub user_id: Uuid,
    pub items: Vec<ChecklistItem>,
    pub overall_status: ChecklistItemStatus,
    pub started_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

impl UserProvisioningChecklist {
    pub fn new(user_id: Uuid) -> Self {
        Self {
            user_id,
            items: vec![
                ChecklistItem {
                    id: "generate_dek".to_string(),
                    description: "Generate user DEK".to_string(),
                    status: ChecklistItemStatus::Pending,
                    error: None,
                    completed_at: None,
                },
                ChecklistItem {
                    id: "store_dek".to_string(),
                    description: "Store DEK in vault (encrypted with master key)".to_string(),
                    status: ChecklistItemStatus::Pending,
                    error: None,
                    completed_at: None,
                },
                ChecklistItem {
                    id: "create_user".to_string(),
                    description: "Create user record in database".to_string(),
                    status: ChecklistItemStatus::Pending,
                    error: None,
                    completed_at: None,
                },
                ChecklistItem {
                    id: "create_relationships".to_string(),
                    description: "Create default Zanzibar relationships".to_string(),
                    status: ChecklistItemStatus::Pending,
                    error: None,
                    completed_at: None,
                },
                ChecklistItem {
                    id: "assign_role".to_string(),
                    description: "Assign default role (if any)".to_string(),
                    status: ChecklistItemStatus::Pending,
                    error: None,
                    completed_at: None,
                },
                ChecklistItem {
                    id: "organization_membership".to_string(),
                    description: "Create organization membership relationship".to_string(),
                    status: ChecklistItemStatus::Pending,
                    error: None,
                    completed_at: None,
                },
                ChecklistItem {
                    id: "grant_app_access".to_string(),
                    description: "Grant default app access".to_string(),
                    status: ChecklistItemStatus::Pending,
                    error: None,
                    completed_at: None,
                },
                ChecklistItem {
                    id: "audit_log".to_string(),
                    description: "Create audit log entry".to_string(),
                    status: ChecklistItemStatus::Pending,
                    error: None,
                    completed_at: None,
                },
            ],
            overall_status: ChecklistItemStatus::Pending,
            started_at: Utc::now(),
            completed_at: None,
        }
    }
    
    pub fn mark_item_in_progress(&mut self, item_id: &str) {
        if let Some(item) = self.items.iter_mut().find(|i| i.id == item_id) {
            item.status = ChecklistItemStatus::InProgress;
        }
        self.update_overall_status();
    }
    
    pub fn mark_item_completed(&mut self, item_id: &str) {
        if let Some(item) = self.items.iter_mut().find(|i| i.id == item_id) {
            item.status = ChecklistItemStatus::Completed;
            item.completed_at = Some(Utc::now());
        }
        self.update_overall_status();
    }
    
    pub fn mark_item_failed(&mut self, item_id: &str, error: String) {
        if let Some(item) = self.items.iter_mut().find(|i| i.id == item_id) {
            item.status = ChecklistItemStatus::Failed;
            item.error = Some(error);
        }
        self.update_overall_status();
    }
    
    fn update_overall_status(&mut self) {
        let has_failed = self.items.iter().any(|i| i.status == ChecklistItemStatus::Failed);
        let all_completed = self.items.iter().all(|i| i.status == ChecklistItemStatus::Completed);
        let has_in_progress = self.items.iter().any(|i| i.status == ChecklistItemStatus::InProgress);
        
        if has_failed {
            self.overall_status = ChecklistItemStatus::Failed;
        } else if all_completed {
            self.overall_status = ChecklistItemStatus::Completed;
            self.completed_at = Some(Utc::now());
        } else if has_in_progress {
            self.overall_status = ChecklistItemStatus::InProgress;
        } else {
            self.overall_status = ChecklistItemStatus::Pending;
        }
    }
    
    pub fn is_completed(&self) -> bool {
        self.overall_status == ChecklistItemStatus::Completed
    }
    
    pub fn has_failures(&self) -> bool {
        self.overall_status == ChecklistItemStatus::Failed
    }
}

