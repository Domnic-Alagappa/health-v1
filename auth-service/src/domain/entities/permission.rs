use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Permission {
    pub id: Uuid,
    pub name: String,
    pub resource: String, // e.g., "patient", "order", "document"
    pub action: String,  // e.g., "read", "write", "delete"
    pub description: Option<String>,
}

impl Permission {
    pub fn new(name: String, resource: String, action: String, description: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            resource,
            action,
            description,
        }
    }

    pub fn to_string(&self) -> String {
        format!("{}:{}", self.resource, self.action)
    }
}

