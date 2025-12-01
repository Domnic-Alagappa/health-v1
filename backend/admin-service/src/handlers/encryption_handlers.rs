use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};
use shared::AppState;
use std::sync::Arc;
use uuid::Uuid;

// Type aliases for convenience
type ConcreteAppState = shared::AppState<
    authz_core::auth::LoginUseCase,
    authz_core::auth::RefreshTokenUseCase,
    authz_core::auth::LogoutUseCase,
    authz_core::auth::UserInfoUseCase,
    admin_service::use_cases::setup::SetupOrganizationUseCase,
    admin_service::use_cases::setup::CreateSuperAdminUseCase,
>;

#[derive(Debug, Deserialize)]
pub struct RotateDekRequest {
    pub reason: String,
}

/// Rotate master key (admin only)
/// This only re-encrypts DEKs in vault, NOT user data
pub async fn rotate_master_key(
    State(_state): State<Arc<ConcreteAppState>>,
) -> impl IntoResponse {
    // TODO: Implement master key rotation
    // This requires:
    // 1. Getting old master key
    // 2. Generating new master key
    // 3. Re-encrypting all DEKs
    // 4. Updating master key storage
    
    (
        StatusCode::NOT_IMPLEMENTED,
        Json(serde_json::json!({
            "error": "Master key rotation not yet implemented"
        })),
    )
        .into_response()
}

/// Rotate user DEK
/// This re-encrypts ALL user data with new DEK
pub async fn rotate_user_dek(
    State(state): State<Arc<ConcreteAppState>>,
    Path(user_id): Path<Uuid>,
    Json(request): Json<RotateDekRequest>,
) -> impl IntoResponse {
    use shared::infrastructure::encryption::DekRotation;
    
    let dek_rotation = DekRotation::new(
        state.dek_manager.clone(),
        state.database_pool.as_ref().clone(),
    );
    
    match dek_rotation.rotate_user_dek(user_id, &request.reason).await {
        Ok(result) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "success": true,
                "user_id": result.user_id,
                "reason": result.reason,
                "fields_rotated": result.fields_rotated,
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to rotate user DEK: {}", e)
            })),
        )
            .into_response(),
    }
}

/// Get DEK rotation status
pub async fn get_dek_status(
    State(_state): State<Arc<ConcreteAppState>>,
    Path(_user_id): Path<Uuid>,
) -> impl IntoResponse {
    // TODO: Implement DEK status check
    (
        StatusCode::NOT_IMPLEMENTED,
        Json(serde_json::json!({
            "error": "DEK status check not yet implemented"
        })),
    )
        .into_response()
}

