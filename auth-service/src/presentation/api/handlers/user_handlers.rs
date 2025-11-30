use axum::{Json, extract::Path, http::StatusCode, response::IntoResponse};
use crate::application::dto::{CreateUserRequest, UpdateUserRequest};
use uuid::Uuid;

pub async fn create_user(
    Json(_request): Json<CreateUserRequest>,
) -> impl IntoResponse {
    // TODO: Implement when database is configured
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({"error": "Not yet implemented - database not configured"})))
}

pub async fn get_user() -> impl IntoResponse {
    // TODO: Implement when database is configured
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({"error": "Not yet implemented - database not configured"})))
}

pub async fn update_user(
    Path(_id): Path<Uuid>,
    Json(_request): Json<UpdateUserRequest>,
) -> impl IntoResponse {
    // TODO: Implement when database is configured
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({"error": "Not yet implemented - database not configured"})))
}

pub async fn delete_user(
    Path(_id): Path<Uuid>,
) -> impl IntoResponse {
    // TODO: Implement when database is configured
    (StatusCode::NOT_IMPLEMENTED, Json(serde_json::json!({"error": "Not yet implemented - database not configured"})))
}

