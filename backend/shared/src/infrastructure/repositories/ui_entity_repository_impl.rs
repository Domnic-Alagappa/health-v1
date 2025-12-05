use crate::domain::entities::{UiPage, UiButton, UiField, UiApiEndpoint};
use crate::domain::repositories::UiEntityRepository;
use crate::infrastructure::database::queries::ui_entities::*;
use crate::shared::AppResult;
use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

pub struct UiEntityRepositoryImpl {
    pool: PgPool,
}

impl UiEntityRepositoryImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl UiEntityRepository for UiEntityRepositoryImpl {
    // Page methods
    async fn register_page(&self, page: UiPage) -> AppResult<UiPage> {
        sqlx::query_as::<_, UiPage>(UI_PAGE_INSERT)
            .bind(page.id)
            .bind(&page.name)
            .bind(&page.path)
            .bind(&page.description)
            .bind(&page.metadata)
            .bind(page.created_at)
            .bind(page.updated_at)
            .bind(page.deleted_at)
            .bind(page.deleted_by)
            .bind(&page.request_id)
            .bind(page.created_by)
            .bind(page.updated_by)
            .bind(&page.system_id)
            .bind(page.version)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_page_by_id(&self, id: Uuid) -> AppResult<Option<UiPage>> {
        sqlx::query_as::<_, UiPage>(UI_PAGE_FIND_BY_ID)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_page_by_name(&self, name: &str) -> AppResult<Option<UiPage>> {
        sqlx::query_as::<_, UiPage>(UI_PAGE_FIND_BY_NAME)
            .bind(name)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_page_by_path(&self, path: &str) -> AppResult<Option<UiPage>> {
        sqlx::query_as::<_, UiPage>(UI_PAGE_FIND_BY_PATH)
            .bind(path)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn list_pages(&self) -> AppResult<Vec<UiPage>> {
        sqlx::query_as::<_, UiPage>(UI_PAGE_LIST)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn update_page(&self, page: UiPage) -> AppResult<UiPage> {
        sqlx::query_as::<_, UiPage>(UI_PAGE_UPDATE)
            .bind(page.id)
            .bind(&page.name)
            .bind(&page.path)
            .bind(&page.description)
            .bind(&page.metadata)
            .bind(page.updated_at)
            .bind(page.deleted_at)
            .bind(page.deleted_by)
            .bind(&page.request_id)
            .bind(page.updated_by)
            .bind(&page.system_id)
            .bind(page.version)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn soft_delete_page(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()> {
        sqlx::query(UI_PAGE_SOFT_DELETE)
            .bind(id)
            .bind(deleted_by)
            .execute(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))?;
        Ok(())
    }

    // Button methods
    async fn register_button(&self, button: UiButton) -> AppResult<UiButton> {
        sqlx::query_as::<_, UiButton>(UI_BUTTON_INSERT)
            .bind(button.id)
            .bind(button.page_id)
            .bind(&button.button_id)
            .bind(&button.label)
            .bind(&button.action)
            .bind(&button.metadata)
            .bind(button.created_at)
            .bind(button.updated_at)
            .bind(button.deleted_at)
            .bind(button.deleted_by)
            .bind(&button.request_id)
            .bind(button.created_by)
            .bind(button.updated_by)
            .bind(&button.system_id)
            .bind(button.version)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_button_by_id(&self, id: Uuid) -> AppResult<Option<UiButton>> {
        sqlx::query_as::<_, UiButton>(UI_BUTTON_FIND_BY_ID)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_button_by_page_and_id(&self, page_id: Uuid, button_id: &str) -> AppResult<Option<UiButton>> {
        sqlx::query_as::<_, UiButton>(UI_BUTTON_FIND_BY_PAGE_AND_ID)
            .bind(page_id)
            .bind(button_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn list_buttons_for_page(&self, page_id: Uuid) -> AppResult<Vec<UiButton>> {
        sqlx::query_as::<_, UiButton>(UI_BUTTON_LIST_FOR_PAGE)
            .bind(page_id)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn update_button(&self, button: UiButton) -> AppResult<UiButton> {
        sqlx::query_as::<_, UiButton>(UI_BUTTON_UPDATE)
            .bind(button.id)
            .bind(button.page_id)
            .bind(&button.button_id)
            .bind(&button.label)
            .bind(&button.action)
            .bind(&button.metadata)
            .bind(button.updated_at)
            .bind(button.deleted_at)
            .bind(button.deleted_by)
            .bind(&button.request_id)
            .bind(button.updated_by)
            .bind(&button.system_id)
            .bind(button.version)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn soft_delete_button(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()> {
        sqlx::query(UI_BUTTON_SOFT_DELETE)
            .bind(id)
            .bind(deleted_by)
            .execute(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))?;
        Ok(())
    }

    // Field methods
    async fn register_field(&self, field: UiField) -> AppResult<UiField> {
        sqlx::query_as::<_, UiField>(UI_FIELD_INSERT)
            .bind(field.id)
            .bind(field.page_id)
            .bind(&field.field_id)
            .bind(&field.label)
            .bind(&field.field_type)
            .bind(&field.metadata)
            .bind(field.created_at)
            .bind(field.updated_at)
            .bind(field.deleted_at)
            .bind(field.deleted_by)
            .bind(&field.request_id)
            .bind(field.created_by)
            .bind(field.updated_by)
            .bind(&field.system_id)
            .bind(field.version)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_field_by_id(&self, id: Uuid) -> AppResult<Option<UiField>> {
        sqlx::query_as::<_, UiField>(UI_FIELD_FIND_BY_ID)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_field_by_page_and_id(&self, page_id: Uuid, field_id: &str) -> AppResult<Option<UiField>> {
        sqlx::query_as::<_, UiField>(UI_FIELD_FIND_BY_PAGE_AND_ID)
            .bind(page_id)
            .bind(field_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn list_fields_for_page(&self, page_id: Uuid) -> AppResult<Vec<UiField>> {
        sqlx::query_as::<_, UiField>(UI_FIELD_LIST_FOR_PAGE)
            .bind(page_id)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn update_field(&self, field: UiField) -> AppResult<UiField> {
        sqlx::query_as::<_, UiField>(UI_FIELD_UPDATE)
            .bind(field.id)
            .bind(field.page_id)
            .bind(&field.field_id)
            .bind(&field.label)
            .bind(&field.field_type)
            .bind(&field.metadata)
            .bind(field.updated_at)
            .bind(field.deleted_at)
            .bind(field.deleted_by)
            .bind(&field.request_id)
            .bind(field.updated_by)
            .bind(&field.system_id)
            .bind(field.version)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn soft_delete_field(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()> {
        sqlx::query(UI_FIELD_SOFT_DELETE)
            .bind(id)
            .bind(deleted_by)
            .execute(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))?;
        Ok(())
    }

    // API endpoint methods
    async fn register_api(&self, api: UiApiEndpoint) -> AppResult<UiApiEndpoint> {
        sqlx::query_as::<_, UiApiEndpoint>(UI_API_INSERT)
            .bind(api.id)
            .bind(&api.endpoint)
            .bind(&api.method)
            .bind(&api.description)
            .bind(&api.metadata)
            .bind(api.created_at)
            .bind(api.updated_at)
            .bind(api.deleted_at)
            .bind(api.deleted_by)
            .bind(&api.request_id)
            .bind(api.created_by)
            .bind(api.updated_by)
            .bind(&api.system_id)
            .bind(api.version)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_api_by_id(&self, id: Uuid) -> AppResult<Option<UiApiEndpoint>> {
        sqlx::query_as::<_, UiApiEndpoint>(UI_API_FIND_BY_ID)
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_api_by_endpoint_and_method(&self, endpoint: &str, method: &str) -> AppResult<Option<UiApiEndpoint>> {
        sqlx::query_as::<_, UiApiEndpoint>(UI_API_FIND_BY_ENDPOINT_AND_METHOD)
            .bind(endpoint)
            .bind(method)
            .fetch_optional(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn list_apis(&self) -> AppResult<Vec<UiApiEndpoint>> {
        sqlx::query_as::<_, UiApiEndpoint>(UI_API_LIST)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn update_api(&self, api: UiApiEndpoint) -> AppResult<UiApiEndpoint> {
        sqlx::query_as::<_, UiApiEndpoint>(UI_API_UPDATE)
            .bind(api.id)
            .bind(&api.endpoint)
            .bind(&api.method)
            .bind(&api.description)
            .bind(&api.metadata)
            .bind(api.updated_at)
            .bind(api.deleted_at)
            .bind(api.deleted_by)
            .bind(&api.request_id)
            .bind(api.updated_by)
            .bind(&api.system_id)
            .bind(api.version)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn soft_delete_api(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()> {
        sqlx::query(UI_API_SOFT_DELETE)
            .bind(id)
            .bind(deleted_by)
            .execute(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))?;
        Ok(())
    }
}

