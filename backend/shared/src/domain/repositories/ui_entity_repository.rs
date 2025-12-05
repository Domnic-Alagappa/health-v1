use async_trait::async_trait;
use crate::domain::entities::{UiPage, UiButton, UiField, UiApiEndpoint};
use crate::shared::AppResult;
use uuid::Uuid;

#[async_trait]
pub trait UiEntityRepository: Send + Sync {
    // Page methods
    async fn register_page(&self, page: UiPage) -> AppResult<UiPage>;
    async fn find_page_by_id(&self, id: Uuid) -> AppResult<Option<UiPage>>;
    async fn find_page_by_name(&self, name: &str) -> AppResult<Option<UiPage>>;
    async fn find_page_by_path(&self, path: &str) -> AppResult<Option<UiPage>>;
    async fn list_pages(&self) -> AppResult<Vec<UiPage>>;
    async fn update_page(&self, page: UiPage) -> AppResult<UiPage>;
    async fn soft_delete_page(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()>;
    
    // Button methods
    async fn register_button(&self, button: UiButton) -> AppResult<UiButton>;
    async fn find_button_by_id(&self, id: Uuid) -> AppResult<Option<UiButton>>;
    async fn find_button_by_page_and_id(&self, page_id: Uuid, button_id: &str) -> AppResult<Option<UiButton>>;
    async fn list_buttons_for_page(&self, page_id: Uuid) -> AppResult<Vec<UiButton>>;
    async fn update_button(&self, button: UiButton) -> AppResult<UiButton>;
    async fn soft_delete_button(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()>;
    
    // Field methods
    async fn register_field(&self, field: UiField) -> AppResult<UiField>;
    async fn find_field_by_id(&self, id: Uuid) -> AppResult<Option<UiField>>;
    async fn find_field_by_page_and_id(&self, page_id: Uuid, field_id: &str) -> AppResult<Option<UiField>>;
    async fn list_fields_for_page(&self, page_id: Uuid) -> AppResult<Vec<UiField>>;
    async fn update_field(&self, field: UiField) -> AppResult<UiField>;
    async fn soft_delete_field(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()>;
    
    // API endpoint methods
    async fn register_api(&self, api: UiApiEndpoint) -> AppResult<UiApiEndpoint>;
    async fn find_api_by_id(&self, id: Uuid) -> AppResult<Option<UiApiEndpoint>>;
    async fn find_api_by_endpoint_and_method(&self, endpoint: &str, method: &str) -> AppResult<Option<UiApiEndpoint>>;
    async fn list_apis(&self) -> AppResult<Vec<UiApiEndpoint>>;
    async fn update_api(&self, api: UiApiEndpoint) -> AppResult<UiApiEndpoint>;
    async fn soft_delete_api(&self, id: Uuid, deleted_by: Option<Uuid>) -> AppResult<()>;
}

