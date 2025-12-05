use shared::domain::repositories::{SetupRepository, UserRepository};
use shared::AppResult;
use uuid::Uuid;

pub struct SetupOrganizationUseCase {
    setup_repository: Box<dyn SetupRepository>,
    #[allow(dead_code)]
    user_repository: Box<dyn UserRepository>,
}

impl SetupOrganizationUseCase {
    pub fn new(
        setup_repository: Box<dyn SetupRepository>,
        user_repository: Box<dyn UserRepository>,
    ) -> Self {
        Self {
            setup_repository,
            user_repository,
        }
    }

    pub async fn execute(
        &self,
        name: &str,
        slug: &str,
        domain: Option<&str>,
        force: bool,
    ) -> AppResult<Uuid> {
        // Validate that setup hasn't been completed (unless force is true)
        if !force {
            let is_completed = self.setup_repository.is_setup_completed().await?;
            if is_completed {
                return Err(shared::AppError::Validation(
                    "Setup has already been completed".to_string(),
                ));
            }
        }

        // Validate inputs
        if name.trim().is_empty() {
            return Err(shared::AppError::Validation(
                "Organization name cannot be empty".to_string(),
            ));
        }

        if slug.trim().is_empty() {
            return Err(shared::AppError::Validation(
                "Organization slug cannot be empty".to_string(),
            ));
        }

        // Validate slug format (alphanumeric and hyphens only)
        if !slug.chars().all(|c| c.is_alphanumeric() || c == '-') {
            return Err(shared::AppError::Validation(
                "Organization slug can only contain alphanumeric characters and hyphens".to_string(),
            ));
        }

        // If force is true, check if organization already exists by slug
        if force {
            if let Some(existing_org) = self.setup_repository.get_organization_by_slug(slug).await? {
                // Organization already exists, return its ID
                return Ok(existing_org.id);
            }
        }

        // Create organization
        let org_id = self
            .setup_repository
            .create_organization(name, slug, domain)
            .await?;

        Ok(org_id)
    }
}

