use shared::domain::repositories::{UserRepository, RoleRepository};
use shared::infrastructure::zanzibar::RelationshipStore;
use shared::AppResult;
use uuid::Uuid;
use std::sync::Arc;

pub struct AssignRoleUseCase {
    user_repository: Box<dyn UserRepository>,
    role_repository: Box<dyn RoleRepository>,
    relationship_store: Arc<RelationshipStore>,
}

impl AssignRoleUseCase {
    pub fn new(
        user_repository: Box<dyn UserRepository>,
        role_repository: Box<dyn RoleRepository>,
        relationship_store: Arc<RelationshipStore>,
    ) -> Self {
        Self {
            user_repository,
            role_repository,
            relationship_store,
        }
    }

    pub async fn execute(
        &self,
        user_id: Uuid,
        role_id: Uuid,
    ) -> AppResult<()> {
        // Verify user exists
        let user = self.user_repository
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| shared::AppError::NotFound(
                format!("User {} not found", user_id)
            ))?;

        // Verify role exists
        let role = self.role_repository
            .find_by_id(role_id)
            .await?
            .ok_or_else(|| shared::AppError::NotFound(
                format!("Role {} not found", role_id)
            ))?;

        // Create Zanzibar relationship: user#has_role@role
        let user_str = format!("user:{}", user_id);
        let role_str = format!("role:{}", role.name);
        
        self.relationship_store
            .add(&user_str, "has_role", &role_str)
            .await?;

        // Role assignment is now Zanzibar-only, no need for user_roles table

        Ok(())
    }
}

