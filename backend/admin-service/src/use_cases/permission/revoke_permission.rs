use shared::infrastructure::zanzibar::RelationshipStore;
use shared::AppResult;
use uuid::Uuid;
use std::sync::Arc;

pub struct RevokePermissionUseCase {
    relationship_store: Arc<RelationshipStore>,
}

impl RevokePermissionUseCase {
    pub fn new(relationship_store: Arc<RelationshipStore>) -> Self {
        Self { relationship_store }
    }

    pub async fn execute(
        &self,
        user_id: Uuid,
        relation: &str,
        object: &str,
        revoked_by: Option<Uuid>,
    ) -> AppResult<()> {
        let user_str = format!("user:{}", user_id);
        
        self.relationship_store
            .revoke(&user_str, relation, object, revoked_by)
            .await?;
        
        Ok(())
    }
}

