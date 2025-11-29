use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

/// Zanzibar-style relationship tuple
/// Format: user:123#member@group:456
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash, FromRow)]
pub struct Relationship {
    pub id: Uuid,
    pub user: String,        // user:123
    pub relation: String,    // member
    pub object: String,      // group:456
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl Relationship {
    pub fn new(user: String, relation: String, object: String) -> Self {
        Self {
            id: Uuid::new_v4(),
            user,
            relation,
            object,
            created_at: chrono::Utc::now(),
        }
    }

    /// Format as Zanzibar tuple string: user:123#member@group:456
    pub fn to_tuple_string(&self) -> String {
        format!("{}#{}@{}", self.user, self.relation, self.object)
    }

    /// Parse from tuple string
    pub fn from_tuple_string(tuple: &str) -> Result<Self, String> {
        let parts: Vec<&str> = tuple.split('#').collect();
        if parts.len() != 2 {
            return Err("Invalid tuple format".to_string());
        }

        let user = parts[0].to_string();
        let relation_object: Vec<&str> = parts[1].split('@').collect();
        if relation_object.len() != 2 {
            return Err("Invalid tuple format".to_string());
        }

        let relation = relation_object[0].to_string();
        let object = relation_object[1].to_string();

        Ok(Self::new(user, relation, object))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_relationship_tuple_string() {
        let rel = Relationship::new(
            "user:123".to_string(),
            "member".to_string(),
            "group:456".to_string(),
        );
        assert_eq!(rel.to_tuple_string(), "user:123#member@group:456");
    }

    #[test]
    fn test_relationship_from_tuple_string() {
        let rel = Relationship::from_tuple_string("user:123#member@group:456").unwrap();
        assert_eq!(rel.user, "user:123");
        assert_eq!(rel.relation, "member");
        assert_eq!(rel.object, "group:456");
    }
}

