use shared::infrastructure::zanzibar::RelationshipStore;
use shared::AppResult;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use std::sync::Arc;

pub struct ExtendPermissionUseCase {
    relationship_store: Arc<RelationshipStore>,
}

impl ExtendPermissionUseCase {
    pub fn new(relationship_store: Arc<RelationshipStore>) -> Self {
        Self { relationship_store }
    }

    pub async fn execute(
        &self,
        user_id: Uuid,
        relation: &str,
        object: &str,
        new_expires_at: DateTime<Utc>,
    ) -> AppResult<()> {
        let user_str = format!("user:{}", user_id);
        
        self.relationship_store
            .extend_expiration(&user_str, relation, object, new_expires_at)
            .await?;
        
        Ok(())
    }
}

