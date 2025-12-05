use shared::domain::entities::UiPage;
use shared::domain::repositories::UiEntityRepository;
use shared::infrastructure::zanzibar::RelationshipStore;
use shared::AppResult;
use std::sync::Arc;

pub struct RegisterPageUseCase {
    ui_entity_repository: Box<dyn UiEntityRepository>,
    #[allow(dead_code)]
    relationship_store: Arc<RelationshipStore>,
}

impl RegisterPageUseCase {
    pub fn new(
        ui_entity_repository: Box<dyn UiEntityRepository>,
        relationship_store: Arc<RelationshipStore>,
    ) -> Self {
        Self {
            ui_entity_repository,
            relationship_store,
        }
    }

    pub async fn execute(
        &self,
        name: &str,
        path: &str,
        description: Option<String>,
    ) -> AppResult<UiPage> {
        // Validate inputs
        if name.trim().is_empty() {
            return Err(shared::AppError::Validation(
                "Page name cannot be empty".to_string(),
            ));
        }

        if path.trim().is_empty() {
            return Err(shared::AppError::Validation(
                "Page path cannot be empty".to_string(),
            ));
        }

        // Check if page already exists
        if let Some(_existing) = self.ui_entity_repository
            .find_page_by_name(name)
            .await?
        {
            return Err(shared::AppError::Validation(
                "Page with this name already exists".to_string(),
            ));
        }

        // Check if path already exists
        if let Some(_existing) = self.ui_entity_repository
            .find_page_by_path(path)
            .await?
        {
            return Err(shared::AppError::Validation(
                "Page with this path already exists".to_string(),
            ));
        }

        // Create page
        let page = UiPage::new(
            name.to_string(),
            path.to_string(),
            description,
        );

        let created_page = self.ui_entity_repository.register_page(page).await?;

        // Note: Default Zanzibar relationships for pages can be created here if needed
        // For example, grant admin role access by default
        // This is optional and can be done later via permission assignment

        Ok(created_page)
    }
}

