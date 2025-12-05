use axum::{Json, extract::{State, Path}, http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};
use shared::domain::repositories::UiEntityRepository;
use shared::infrastructure::repositories::UiEntityRepositoryImpl;
use std::sync::Arc;
use uuid::Uuid;

// Type aliases for convenience
type ConcreteAppState = shared::AppState<
    authz_core::auth::LoginUseCase,
    authz_core::auth::RefreshTokenUseCase,
    authz_core::auth::LogoutUseCase,
    authz_core::auth::UserInfoUseCase,
    crate::use_cases::setup::SetupOrganizationUseCase,
    crate::use_cases::setup::CreateSuperAdminUseCase,
>;

#[derive(Debug, Deserialize)]
pub struct RegisterPageRequest {
    pub name: String,
    pub path: String,
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterButtonRequest {
    pub page_id: Uuid,
    pub button_id: String,
    pub label: String,
    pub action: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RegisterFieldRequest {
    pub page_id: Uuid,
    pub field_id: String,
    pub label: String,
    pub field_type: String,
}

#[derive(Debug, Deserialize)]
pub struct RegisterApiRequest {
    pub endpoint: String,
    pub method: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PageResponse {
    pub id: Uuid,
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub zanzibar_resource: String,
}

#[derive(Debug, Serialize)]
pub struct ButtonResponse {
    pub id: Uuid,
    pub page_id: Uuid,
    pub button_id: String,
    pub label: String,
    pub action: Option<String>,
    pub zanzibar_resource: String,
}

#[derive(Debug, Serialize)]
pub struct FieldResponse {
    pub id: Uuid,
    pub page_id: Uuid,
    pub field_id: String,
    pub label: String,
    pub field_type: String,
    pub zanzibar_resource: String,
}

#[derive(Debug, Serialize)]
pub struct ApiResponse {
    pub id: Uuid,
    pub endpoint: String,
    pub method: String,
    pub description: Option<String>,
    pub zanzibar_resource: String,
}

impl From<&shared::domain::entities::UiPage> for PageResponse {
    fn from(page: &shared::domain::entities::UiPage) -> Self {
        Self {
            id: page.id,
            name: page.name.clone(),
            path: page.path.clone(),
            description: page.description.clone(),
            zanzibar_resource: page.to_zanzibar_resource(),
        }
    }
}

impl From<&shared::domain::entities::UiButton> for ButtonResponse {
    fn from(button: &shared::domain::entities::UiButton) -> Self {
        Self {
            id: button.id,
            page_id: button.page_id,
            button_id: button.button_id.clone(),
            label: button.label.clone(),
            action: button.action.clone(),
            zanzibar_resource: button.to_zanzibar_resource(),
        }
    }
}

impl From<&shared::domain::entities::UiField> for FieldResponse {
    fn from(field: &shared::domain::entities::UiField) -> Self {
        Self {
            id: field.id,
            page_id: field.page_id,
            field_id: field.field_id.clone(),
            label: field.label.clone(),
            field_type: field.field_type.clone(),
            zanzibar_resource: field.to_zanzibar_resource(),
        }
    }
}

impl From<&shared::domain::entities::UiApiEndpoint> for ApiResponse {
    fn from(api: &shared::domain::entities::UiApiEndpoint) -> Self {
        Self {
            id: api.id,
            endpoint: api.endpoint.clone(),
            method: api.method.clone(),
            description: api.description.clone(),
            zanzibar_resource: api.to_zanzibar_resource(),
        }
    }
}

/// Register a new UI page
pub async fn register_page(
    State(state): State<Arc<ConcreteAppState>>,
    Json(request): Json<RegisterPageRequest>,
) -> impl IntoResponse {
    use crate::use_cases::ui::RegisterPageUseCase;
    
    let ui_entity_repository = Box::new(UiEntityRepositoryImpl::new(state.database_pool.as_ref().clone()));
    let use_case = RegisterPageUseCase::new(
        ui_entity_repository,
        state.relationship_store.clone(),
    );
    
    match use_case.execute(&request.name, &request.path, request.description).await {
        Ok(page) => (
            StatusCode::CREATED,
            Json(PageResponse::from(&page)),
        )
            .into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to register page: {}", e)
            })),
        )
            .into_response(),
    }
}

/// List all registered pages
pub async fn list_pages(
    State(state): State<Arc<ConcreteAppState>>,
) -> impl IntoResponse {
    let ui_entity_repository = UiEntityRepositoryImpl::new(state.database_pool.as_ref().clone());
    
    match ui_entity_repository.list_pages().await {
        Ok(pages) => {
            let pages_response: Vec<PageResponse> = pages.iter().map(PageResponse::from).collect();
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "pages": pages_response
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to list pages: {}", e)
            })),
        )
            .into_response(),
    }
}

/// Register a new UI button
pub async fn register_button(
    State(state): State<Arc<ConcreteAppState>>,
    Json(request): Json<RegisterButtonRequest>,
) -> impl IntoResponse {
    use crate::use_cases::ui::RegisterButtonUseCase;
    
    let ui_entity_repository = Box::new(UiEntityRepositoryImpl::new(state.database_pool.as_ref().clone()));
    let use_case = RegisterButtonUseCase::new(
        ui_entity_repository,
        state.relationship_store.clone(),
    );
    
    match use_case.execute(request.page_id, &request.button_id, &request.label, request.action).await {
        Ok(button) => (
            StatusCode::CREATED,
            Json(ButtonResponse::from(&button)),
        )
            .into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to register button: {}", e)
            })),
        )
            .into_response(),
    }
}

/// List buttons for a page
pub async fn list_buttons_for_page(
    State(state): State<Arc<ConcreteAppState>>,
    Path(page_id): Path<Uuid>,
) -> impl IntoResponse {
    let ui_entity_repository = UiEntityRepositoryImpl::new(state.database_pool.as_ref().clone());
    
    match ui_entity_repository.list_buttons_for_page(page_id).await {
        Ok(buttons) => {
            let buttons_response: Vec<ButtonResponse> = buttons.iter().map(ButtonResponse::from).collect();
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "buttons": buttons_response
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to list buttons: {}", e)
            })),
        )
            .into_response(),
    }
}

/// Register a new UI field
pub async fn register_field(
    State(state): State<Arc<ConcreteAppState>>,
    Json(request): Json<RegisterFieldRequest>,
) -> impl IntoResponse {
    use crate::use_cases::ui::RegisterFieldUseCase;
    
    let ui_entity_repository = Box::new(UiEntityRepositoryImpl::new(state.database_pool.as_ref().clone()));
    let use_case = RegisterFieldUseCase::new(
        ui_entity_repository,
        state.relationship_store.clone(),
    );
    
    match use_case.execute(request.page_id, &request.field_id, &request.label, &request.field_type).await {
        Ok(field) => (
            StatusCode::CREATED,
            Json(FieldResponse::from(&field)),
        )
            .into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to register field: {}", e)
            })),
        )
            .into_response(),
    }
}

/// List fields for a page
pub async fn list_fields_for_page(
    State(state): State<Arc<ConcreteAppState>>,
    Path(page_id): Path<Uuid>,
) -> impl IntoResponse {
    let ui_entity_repository = UiEntityRepositoryImpl::new(state.database_pool.as_ref().clone());
    
    match ui_entity_repository.list_fields_for_page(page_id).await {
        Ok(fields) => {
            let fields_response: Vec<FieldResponse> = fields.iter().map(FieldResponse::from).collect();
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "fields": fields_response
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to list fields: {}", e)
            })),
        )
            .into_response(),
    }
}

/// Register a new API endpoint
pub async fn register_api(
    State(state): State<Arc<ConcreteAppState>>,
    Json(request): Json<RegisterApiRequest>,
) -> impl IntoResponse {
    use crate::use_cases::ui::RegisterApiUseCase;
    
    let ui_entity_repository = Box::new(UiEntityRepositoryImpl::new(state.database_pool.as_ref().clone()));
    let use_case = RegisterApiUseCase::new(
        ui_entity_repository,
        state.relationship_store.clone(),
    );
    
    match use_case.execute(&request.endpoint, &request.method, request.description).await {
        Ok(api) => (
            StatusCode::CREATED,
            Json(ApiResponse::from(&api)),
        )
            .into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to register API: {}", e)
            })),
        )
            .into_response(),
    }
}

/// List all registered API endpoints
pub async fn list_apis(
    State(state): State<Arc<ConcreteAppState>>,
) -> impl IntoResponse {
    let ui_entity_repository = UiEntityRepositoryImpl::new(state.database_pool.as_ref().clone());
    
    match ui_entity_repository.list_apis().await {
        Ok(apis) => {
            let apis_response: Vec<ApiResponse> = apis.iter().map(ApiResponse::from).collect();
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "apis": apis_response
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to list APIs: {}", e)
            })),
        )
            .into_response(),
    }
}

