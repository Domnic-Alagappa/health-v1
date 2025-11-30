use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use authz_core::dto::{LoginRequest, RefreshTokenRequest};
use shared::{AppState, RequestContext};
use std::sync::Arc;

pub async fn login(
    State(state): State<Arc<AppState>>,
    Json(request): Json<LoginRequest>,
) -> impl IntoResponse {
    match state.login_use_case.execute(request).await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(e) => {
            let status = match e {
                shared::AppError::Authentication(_) => StatusCode::UNAUTHORIZED,
                shared::AppError::NotFound(_) => StatusCode::NOT_FOUND,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            };
            (status, Json(serde_json::json!({"error": format!("{}", e)}))).into_response()
        }
    }
}

pub async fn logout(
    State(state): State<Arc<AppState>>,
    headers: axum::http::HeaderMap,
) -> impl IntoResponse {
    // Extract refresh token from Authorization header
    // The client should send refresh token in Authorization header for logout
    let refresh_token = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok())
        .and_then(|h| h.strip_prefix("Bearer "))
        .map(|s| s.to_string())
        .unwrap_or_default();

    // If token provided, revoke it
    if !refresh_token.is_empty() {
        let _ = state.logout_use_case.execute(&refresh_token).await;
    }

    (StatusCode::OK, Json(serde_json::json!({"message": "Logged out"}))).into_response()
}

pub async fn refresh_token(
    State(state): State<Arc<AppState>>,
    Json(request): Json<RefreshTokenRequest>,
) -> impl IntoResponse {
    match state.refresh_token_use_case.execute(request).await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(e) => {
            let status = match e {
                shared::AppError::Authentication(_) => StatusCode::UNAUTHORIZED,
                shared::AppError::NotFound(_) => StatusCode::NOT_FOUND,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            };
            (status, Json(serde_json::json!({"error": format!("{}", e)}))).into_response()
        }
    }
}

pub async fn userinfo(
    State(state): State<Arc<AppState>>,
    context: RequestContext,
) -> impl IntoResponse {
    // Use user_id from request context (set by auth_middleware)
    match state.userinfo_use_case.execute(context.user_id).await {
        Ok(response) => (StatusCode::OK, Json(response)).into_response(),
        Err(e) => {
            let status = match e {
                shared::AppError::NotFound(_) => StatusCode::NOT_FOUND,
                shared::AppError::Authentication(_) => StatusCode::UNAUTHORIZED,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            };
            (status, Json(serde_json::json!({"error": format!("{}", e)}))).into_response()
        }
    }
}

