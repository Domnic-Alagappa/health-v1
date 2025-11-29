use async_trait::async_trait;
use crate::domain::entities::Relationship;
use crate::domain::repositories::RelationshipRepository;
use crate::shared::AppResult;

pub struct RelationshipStore {
    repository: Box<dyn RelationshipRepository>,
}

impl RelationshipStore {
    pub fn new(repository: Box<dyn RelationshipRepository>) -> Self {
        Self { repository }
    }

    pub async fn add(&self, user: &str, relation: &str, object: &str) -> AppResult<()> {
        let relationship = Relationship::new(
            user.to_string(),
            relation.to_string(),
            object.to_string(),
        );
        self.repository.create(relationship).await?;
        Ok(())
    }

    pub async fn remove(&self, user: &str, relation: &str, object: &str) -> AppResult<()> {
        if let Some(relationship) = self.repository
            .find_by_user_object_relation(user, object, relation)
            .await?
        {
            self.repository.delete(relationship.id).await?;
        }
        Ok(())
    }

    pub async fn check(&self, user: &str, relation: &str, object: &str) -> AppResult<bool> {
        let relationship = self.repository
            .find_by_user_object_relation(user, object, relation)
            .await?;
        Ok(relationship.is_some())
    }

    pub async fn get_relationships(&self, user: &str) -> AppResult<Vec<Relationship>> {
        self.repository.find_by_user(user).await
    }
}

