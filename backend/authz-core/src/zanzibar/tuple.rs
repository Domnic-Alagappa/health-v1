use crate::domain::entities::Relationship;
use crate::shared::AppResult;

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct RelationshipTuple {
    pub user: String,
    pub relation: String,
    pub object: String,
}

impl RelationshipTuple {
    pub fn new(user: String, relation: String, object: String) -> Self {
        Self {
            user,
            relation,
            object,
        }
    }

    pub fn from_relationship(relationship: &Relationship) -> Self {
        Self {
            user: relationship.user.clone(),
            relation: relationship.relation.clone(),
            object: relationship.object.clone(),
        }
    }

    pub fn to_string(&self) -> String {
        format!("{}#{}@{}", self.user, self.relation, self.object)
    }

    pub fn validate(&self) -> AppResult<()> {
        if self.user.is_empty() || self.relation.is_empty() || self.object.is_empty() {
            return Err(crate::shared::AppError::Validation(
                "Relationship tuple cannot have empty fields".to_string(),
            ));
        }
        Ok(())
    }
}

