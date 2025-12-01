use shared::domain::repositories::RoleRepository;
use shared::infrastructure::zanzibar::RelationshipStore;
use shared::AppResult;
use uuid::Uuid;
use std::sync::Arc;

pub struct AssignRoleToGroupUseCase {
    role_repository: Box<dyn RoleRepository>,
    relationship_store: Arc<RelationshipStore>,
}

impl AssignRoleToGroupUseCase {
    pub fn new(
        role_repository: Box<dyn RoleRepository>,
        relationship_store: Arc<RelationshipStore>,
    ) -> Self {
        Self {
            role_repository,
            relationship_store,
        }
    }

    pub async fn execute(
        &self,
        group_id: Uuid,
        role_id: Uuid,
    ) -> AppResult<()> {
        // Verify role exists
        let role = self.role_repository
            .find_by_id(role_id)
            .await?
            .ok_or_else(|| shared::AppError::NotFound(
                format!("Role {} not found", role_id)
            ))?;

        // Create Zanzibar relationship: group#has_role@role
        let group_str = format!("group:{}", group_id);
        let role_str = format!("role:{}", role.name);
        
        self.relationship_store
            .add(&group_str, "has_role", &role_str)
            .await?;

        Ok(())
    }
}

