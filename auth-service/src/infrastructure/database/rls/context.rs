use uuid::Uuid;

/// Security context for RLS
#[derive(Debug, Clone)]
pub struct SecurityContext {
    pub user_id: Option<Uuid>,
    pub roles: Vec<String>,
    pub relationships: Vec<String>, // Zanzibar relationship tuples
}

impl SecurityContext {
    pub fn new() -> Self {
        Self {
            user_id: None,
            roles: Vec::new(),
            relationships: Vec::new(),
        }
    }

    pub fn with_user(mut self, user_id: Uuid) -> Self {
        self.user_id = Some(user_id);
        self
    }

    pub fn with_role(mut self, role: String) -> Self {
        self.roles.push(role);
        self
    }

    pub fn with_relationship(mut self, relationship: String) -> Self {
        self.relationships.push(relationship);
        self
    }
}

impl Default for SecurityContext {
    fn default() -> Self {
        Self::new()
    }
}

