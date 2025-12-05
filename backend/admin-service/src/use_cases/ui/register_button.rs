use shared::domain::entities::UiButton;
use shared::domain::repositories::UiEntityRepository;
use shared::infrastructure::zanzibar::RelationshipStore;
use shared::AppResult;
use uuid::Uuid;
use std::sync::Arc;

pub struct RegisterButtonUseCase {
    ui_entity_repository: Box<dyn UiEntityRepository>,
    #[allow(dead_code)]
    relationship_store: Arc<RelationshipStore>,
}

impl RegisterButtonUseCase {
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
        page_id: Uuid,
        button_id: &str,
        label: &str,
        action: Option<String>,
    ) -> AppResult<UiButton> {
        // Validate inputs
        if button_id.trim().is_empty() {
            return Err(shared::AppError::Validation(
                "Button ID cannot be empty".to_string(),
            ));
        }

        if label.trim().is_empty() {
            return Err(shared::AppError::Validation(
                "Button label cannot be empty".to_string(),
            ));
        }

        // Verify page exists
        let _page = self.ui_entity_repository
            .find_page_by_id(page_id)
            .await?
            .ok_or_else(|| shared::AppError::NotFound(
                format!("Page {} not found", page_id)
            ))?;

        // Check if button already exists for this page
        if let Some(_existing) = self.ui_entity_repository
            .find_button_by_page_and_id(page_id, button_id)
            .await?
        {
            return Err(shared::AppError::Validation(
                format!("Button '{}' already exists for this page", button_id)
            ));
        }

        // Create button
        let button = UiButton::new(
            page_id,
            button_id.to_string(),
            label.to_string(),
            action,
        );

        let created_button = self.ui_entity_repository.register_button(button).await?;

        // Note: Default Zanzibar relationships for buttons can be created here if needed

        Ok(created_button)
    }
}

