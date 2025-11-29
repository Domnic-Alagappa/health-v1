use axum::{Json, http::StatusCode, response::IntoResponse};
use crate::application::dto::{LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse};
use crate::shared::AppResult;

pub async fn login(
    Json(_request): Json<LoginRequest>,
) -> impl IntoResponse {
    // TODO: Implement when database is configured
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({"error": "Not yet implemented - database not configured"})))
}

pub async fn logout() -> impl IntoResponse {
    // TODO: Implement token revocation
    (StatusCode::OK, Json(serde_json::json!({"message": "Logged out"})))
}

pub async fn refresh_token(
    Json(_request): Json<RefreshTokenRequest>,
) -> impl IntoResponse {
    // TODO: Implement when database is configured
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({"error": "Not yet implemented - database not configured"})))
}

pub async fn userinfo() -> impl IntoResponse {
    // TODO: Implement userinfo endpoint
    (StatusCode::OK, Json(serde_json::json!({"sub": "user123", "email": "user@example.com"})))
}

