use shared::domain::entities::UiField;
use shared::domain::repositories::UiEntityRepository;
use shared::infrastructure::zanzibar::RelationshipStore;
use shared::AppResult;
use uuid::Uuid;
use std::sync::Arc;

pub struct RegisterFieldUseCase {
    ui_entity_repository: Box<dyn UiEntityRepository>,
    relationship_store: Arc<RelationshipStore>,
}

impl RegisterFieldUseCase {
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
        field_id: &str,
        label: &str,
        field_type: &str,
    ) -> AppResult<UiField> {
        // Validate inputs
        if field_id.trim().is_empty() {
            return Err(shared::AppError::Validation(
                "Field ID cannot be empty".to_string(),
            ));
        }

        if label.trim().is_empty() {
            return Err(shared::AppError::Validation(
                "Field label cannot be empty".to_string(),
            ));
        }

        if field_type.trim().is_empty() {
            return Err(shared::AppError::Validation(
                "Field type cannot be empty".to_string(),
            ));
        }

        // Verify page exists
        let _page = self.ui_entity_repository
            .find_page_by_id(page_id)
            .await?
            .ok_or_else(|| shared::AppError::NotFound(
                format!("Page {} not found", page_id)
            ))?;

        // Check if field already exists for this page
        if let Some(_existing) = self.ui_entity_repository
            .find_field_by_page_and_id(page_id, field_id)
            .await?
        {
            return Err(shared::AppError::Validation(
                format!("Field '{}' already exists for this page", field_id)
            ));
        }

        // Create field
        let field = UiField::new(
            page_id,
            field_id.to_string(),
            label.to_string(),
            field_type.to_string(),
        );

        let created_field = self.ui_entity_repository.register_field(field).await?;

        // Note: Default Zanzibar relationships for fields can be created here if needed

        Ok(created_field)
    }
}

