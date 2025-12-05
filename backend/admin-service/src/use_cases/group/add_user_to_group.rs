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
        let location = concat!(file!(), ":", line!());
        // Verify user exists
        let _user = self.user_repository
            .find_by_id(user_id)
            .await
            .map_err(|e| {
                e.log_with_operation(location, "add_user_to_group");
                e
            })?
            .ok_or_else(|| {
                let err = shared::AppError::NotFound(
                format!("User {} not found", user_id)
                );
                err.log_with_operation(location, "add_user_to_group");
                err
            })?;

        // Check if user is deleted
        // Note: User entity needs deleted_at field - this will be added in soft delete migration

        // Create Zanzibar relationship: user#member@group
        let user_str = format!("user:{}", user_id);
        let group_str = format!("group:{}", group_id);
        
        self.relationship_store
            .add(&user_str, "member", &group_str)
            .await
            .map_err(|e| {
                e.log_with_operation(location, "add_user_to_group");
                e
            })?;

        Ok(())
    }
}

