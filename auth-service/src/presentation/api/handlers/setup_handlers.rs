use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};
use crate::shared::AppState;
use std::sync::Arc;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct SetupRequest {
    pub organization_name: String,
    pub organization_slug: String,
    pub organization_domain: Option<String>,
    pub admin_email: String,
    pub admin_username: String,
    pub admin_password: String,
}

#[derive(Debug, Serialize)]
pub struct SetupResponse {
    pub success: bool,
    pub message: String,
    pub organization_id: Uuid,
    pub admin_user_id: Uuid,
}

/// Initialize the system (one-time setup)
pub async fn initialize_setup(
    State(state): State<Arc<AppState>>,
    Json(request): Json<SetupRequest>,
) -> impl IntoResponse {
    // Check if setup is already completed
    let is_completed = match state.setup_repository.is_setup_completed().await {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": format!("Failed to check setup status: {}", e)
                })),
            )
                .into_response();
        }
    };

    if is_completed {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": "Setup has already been completed"
            })),
        )
            .into_response();
    }

    // Create organization
    let org_id = match state
        .setup_organization_use_case
        .execute(
            &request.organization_name,
            &request.organization_slug,
            request.organization_domain.as_deref(),
        )
        .await
    {
        Ok(id) => id,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({
                    "error": format!("Failed to create organization: {}", e)
                })),
            )
                .into_response();
        }
    };

    // Create super admin
    let admin_user = match state
        .create_super_admin_use_case
        .execute(
            &request.admin_email,
            &request.admin_username,
            &request.admin_password,
            Some(org_id),
        )
        .await
    {
        Ok(user) => user,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({
                    "error": format!("Failed to create super admin: {}", e)
                })),
            )
                .into_response();
        }
    };

    (
        StatusCode::OK,
        Json(SetupResponse {
            success: true,
            message: "Setup completed successfully".to_string(),
            organization_id: org_id,
            admin_user_id: admin_user.id,
        }),
    )
        .into_response()
}

/// Check setup status
pub async fn check_setup_status(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    match state.setup_repository.is_setup_completed().await {
        Ok(is_completed) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "setup_completed": is_completed
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to check setup status: {}", e)
            })),
        )
            .into_response(),
    }
}

