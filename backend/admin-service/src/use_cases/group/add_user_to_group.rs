use shared::domain::repositories::UserRepository;
use shared::infrastructure::zanzibar::RelationshipStore;
use shared::AppResult;
use uuid::Uuid;
use std::sync::Arc;

pub struct AddUserToGroupUseCase {
    user_repository: Box<dyn UserRepository>,
    relationship_store: Arc<RelationshipStore>,
}

impl AddUserToGroupUseCase {
    pub fn new(
        user_repository: Box<dyn UserRepository>,
        relationship_store: Arc<RelationshipStore>,
    ) -> Self {
        Self {
            user_repository,
            relationship_store,
        }
    }

    pub async fn execute(
        &self,
        user_id: Uuid,
        group_id: Uuid,
    ) -> AppResult<()> {
        // Verify user exists
        let user = self.user_repository
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| shared::AppError::NotFound(
                format!("User {} not found", user_id)
            ))?;

        // Check if user is deleted
        // Note: User entity needs deleted_at field - this will be added in soft delete migration

        // Create Zanzibar relationship: user#member@group
        let user_str = format!("user:{}", user_id);
        let group_str = format!("group:{}", group_id);
        
        self.relationship_store
            .add(&user_str, "member", &group_str)
            .await?;

        Ok(())
    }
}

