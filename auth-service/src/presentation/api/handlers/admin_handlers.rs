use axum::Json;
use crate::shared::AppResult;

pub async fn list_users() -> AppResult<Json<serde_json::Value>> {
    // TODO: Implement admin user list
    Ok(Json(serde_json::json!([])))
}

pub async fn get_audit_logs() -> AppResult<Json<serde_json::Value>> {
    // TODO: Implement audit log retrieval
    Ok(Json(serde_json::json!([])))
}

