use axum::{Json, extract::{State, Path}, http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};
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
pub struct CheckPermissionRequest {
    pub user: String, // user:{id} or just user ID
    pub relation: String,
    pub object: String,
}

#[derive(Debug, Deserialize)]
pub struct BatchCheckPermissionRequest {
    pub checks: Vec<(String, String, String)>, // (user, relation, object)
}

#[derive(Debug, Serialize)]
pub struct CheckPermissionResponse {
    pub allowed: bool,
}

#[derive(Debug, Serialize)]
pub struct BatchCheckPermissionResponse {
    pub results: Vec<bool>,
}

#[derive(Debug, Serialize)]
pub struct UserPermissionsResponse {
    pub user_id: Uuid,
    pub permissions: Vec<PermissionInfo>,
}

#[derive(Debug, Serialize)]
pub struct PermissionInfo {
    pub relation: String,
    pub object: String,
}

/// Check single permission
pub async fn check_permission(
    State(state): State<Arc<ConcreteAppState>>,
    Json(request): Json<CheckPermissionRequest>,
) -> impl IntoResponse {
    // Normalize user string (accept UUID or user:{uuid} format)
    let user_str = if request.user.starts_with("user:") {
        request.user
    } else {
        format!("user:{}", request.user)
    };
    
    match state.permission_checker.check(&user_str, &request.relation, &request.object).await {
        Ok(allowed) => (
            StatusCode::OK,
            Json(CheckPermissionResponse { allowed }),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to check permission: {}", e)
            })),
        )
            .into_response(),
    }
}

/// Batch check multiple permissions
pub async fn check_permissions_batch(
    State(state): State<Arc<ConcreteAppState>>,
    Json(request): Json<BatchCheckPermissionRequest>,
) -> impl IntoResponse {
    // Normalize user strings
    let normalized_checks: Vec<(String, String, String)> = request.checks
        .into_iter()
        .map(|(user, relation, object)| {
            let user_str = if user.starts_with("user:") {
                user
            } else {
                format!("user:{}", user)
            };
            (user_str, relation, object)
        })
        .collect();
    
    match state.permission_checker.check_batch(normalized_checks).await {
        Ok(results) => (
            StatusCode::OK,
            Json(BatchCheckPermissionResponse { results }),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to check permissions: {}", e)
            })),
        )
            .into_response(),
    }
}

/// Get all permissions for a user
pub async fn get_user_permissions(
    State(state): State<Arc<ConcreteAppState>>,
    Path(user_id): Path<Uuid>,
) -> impl IntoResponse {
    let user_str = format!("user:{}", user_id);
    
    match state.permission_checker.get_all_permissions(&user_str).await {
        Ok(permissions) => {
            let permissions_info: Vec<PermissionInfo> = permissions
                .into_iter()
                .map(|(relation, object)| PermissionInfo { relation, object })
                .collect();
            
            (
                StatusCode::OK,
                Json(UserPermissionsResponse {
                    user_id,
                    permissions: permissions_info,
                }),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to get user permissions: {}", e)
            })),
        )
            .into_response(),
    }
}

/// Get user's accessible pages
pub async fn get_user_pages(
    State(state): State<Arc<ConcreteAppState>>,
    Path(user_id): Path<Uuid>,
) -> impl IntoResponse {
    let user_str = format!("user:{}", user_id);
    
    // Get all permissions and filter for pages
    match state.permission_checker.get_all_permissions(&user_str).await {
        Ok(permissions) => {
            let pages: Vec<String> = permissions
                .iter()
                .filter(|(relation, object)| {
                    relation == "can_view" && object.starts_with("page:")
                })
                .map(|(_, object)| object.strip_prefix("page:").unwrap_or(object).to_string())
                .collect();
            
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "user_id": user_id,
                    "pages": pages
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to get user pages: {}", e)
            })),
        )
            .into_response(),
    }
}

/// Get user's accessible buttons for a page
pub async fn get_user_buttons(
    State(state): State<Arc<ConcreteAppState>>,
    Path((user_id, page_name)): Path<(Uuid, String)>,
) -> impl IntoResponse {
    let user_str = format!("user:{}", user_id);
    
    // Get all permissions and filter for buttons
    match state.permission_checker.get_all_permissions(&user_str).await {
        Ok(permissions) => {
            let buttons: Vec<String> = permissions
                .iter()
                .filter(|(relation, object)| {
                    relation == "can_click" && object.starts_with("button:")
                })
                .map(|(_, object)| object.strip_prefix("button:").unwrap_or(object).to_string())
                .collect();
            
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "user_id": user_id,
                    "page": page_name,
                    "buttons": buttons
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to get user buttons: {}", e)
            })),
        )
            .into_response(),
    }
}

/// Get user's accessible fields for a page
pub async fn get_user_fields(
    State(state): State<Arc<ConcreteAppState>>,
    Path((user_id, page_name)): Path<(Uuid, String)>,
) -> impl IntoResponse {
    let user_str = format!("user:{}", user_id);
    
    // Get all permissions and filter for fields
    match state.permission_checker.get_all_permissions(&user_str).await {
        Ok(permissions) => {
            let view_fields: Vec<String> = permissions
                .iter()
                .filter(|(relation, object)| {
                    relation == "can_view" && object.starts_with("field:")
                })
                .map(|(_, object)| object.strip_prefix("field:").unwrap_or(object).to_string())
                .collect();
            
            let edit_fields: Vec<String> = permissions
                .iter()
                .filter(|(relation, object)| {
                    relation == "can_edit" && object.starts_with("field:")
                })
                .map(|(_, object)| object.strip_prefix("field:").unwrap_or(object).to_string())
                .collect();
            
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "user_id": user_id,
                    "page": page_name,
                    "view_fields": view_fields,
                    "edit_fields": edit_fields
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to get user fields: {}", e)
            })),
        )
            .into_response(),
    }
}

