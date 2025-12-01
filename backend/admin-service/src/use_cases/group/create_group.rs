use shared::domain::entities::Group;
use shared::domain::repositories::GroupRepository;
use shared::infrastructure::zanzibar::RelationshipStore;
use shared::AppResult;
use uuid::Uuid;
use std::sync::Arc;

pub struct CreateGroupUseCase {
    group_repository: Box<dyn GroupRepository>,
    relationship_store: Arc<RelationshipStore>,
}

impl CreateGroupUseCase {
    pub fn new(
        group_repository: Box<dyn GroupRepository>,
        relationship_store: Arc<RelationshipStore>,
    ) -> Self {
        Self {
            group_repository,
            relationship_store,
        }
    }

    pub async fn execute(
        &self,
        name: &str,
        description: Option<String>,
        organization_id: Option<Uuid>,
    ) -> AppResult<Group> {
        // Validate inputs
        if name.trim().is_empty() {
            return Err(shared::AppError::Validation(
                "Group name cannot be empty".to_string(),
            ));
        }

        // Check if group already exists
        if let Some(_existing) = self.group_repository
            .find_by_name(name, organization_id)
            .await?
        {
            return Err(shared::AppError::Validation(
                "Group with this name already exists in the organization".to_string(),
            ));
        }

        // Create group
        let mut group = Group::new(
            name.to_string(),
            description,
            organization_id,
        );

        let created_group = self.group_repository.create(group).await?;

        // Create Zanzibar relationship: group#exists@organization
        if let Some(org_id) = organization_id {
            let group_str = format!("group:{}", created_group.id);
            let org_str = format!("organization:{}", org_id);
            self.relationship_store
                .add(&group_str, "exists", &org_str)
                .await?;
        }

        Ok(created_group)
    }
}

