use crate::domain::repositories::{SetupRepository, UserRepository};
use crate::shared::AppResult;
use uuid::Uuid;

pub struct SetupOrganizationUseCase {
    setup_repository: Box<dyn SetupRepository>,
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
    ) -> AppResult<Uuid> {
        // Validate that setup hasn't been completed
        let is_completed = self.setup_repository.is_setup_completed().await?;
        if is_completed {
            return Err(crate::shared::AppError::Validation(
                "Setup has already been completed".to_string(),
            ));
        }

        // Validate inputs
        if name.trim().is_empty() {
            return Err(crate::shared::AppError::Validation(
                "Organization name cannot be empty".to_string(),
            ));
        }

        if slug.trim().is_empty() {
            return Err(crate::shared::AppError::Validation(
                "Organization slug cannot be empty".to_string(),
            ));
        }

        // Validate slug format (alphanumeric and hyphens only)
        if !slug.chars().all(|c| c.is_alphanumeric() || c == '-') {
            return Err(crate::shared::AppError::Validation(
                "Organization slug can only contain alphanumeric characters and hyphens".to_string(),
            ));
        }

        // Create organization
        let org_id = self
            .setup_repository
            .create_organization(name, slug, domain)
            .await?;

        Ok(org_id)
    }
}

