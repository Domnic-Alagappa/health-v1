use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Role {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub permissions: Vec<Uuid>, // Permission IDs
}

impl Role {
    pub fn new(name: String, description: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            name,
            description,
            permissions: Vec::new(),
        }
    }

    pub fn add_permission(&mut self, permission_id: Uuid) {
        if !self.permissions.contains(&permission_id) {
            self.permissions.push(permission_id);
        }
    }

    pub fn remove_permission(&mut self, permission_id: Uuid) {
        self.permissions.retain(|&id| id != permission_id);
    }

    pub fn has_permission(&self, permission_id: Uuid) -> bool {
        self.permissions.contains(&permission_id)
    }
}

