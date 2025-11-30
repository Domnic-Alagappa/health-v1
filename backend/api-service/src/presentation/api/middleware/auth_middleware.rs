use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
    http::StatusCode,
};
use std::sync::Arc;
use uuid::Uuid;
use shared::RequestContext;
use api_service::AppState;

/// Authentication middleware that validates JWT tokens and extracts user context
pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, (StatusCode, axum::Json<serde_json::Value>)> {
    // Extract token from Authorization header
    let auth_header = request.headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                axum::Json(serde_json::json!({
                    "error": "Missing Authorization header"
                })),
            )
        })?;

    if !auth_header.starts_with("Bearer ") {
        return Err((
            StatusCode::UNAUTHORIZED,
            axum::Json(serde_json::json!({
                "error": "Invalid Authorization header format"
            })),
        ));
    }

    let token = &auth_header[7..];

    // Validate token using TokenManager
    let claims = state.token_manager.validate_token(token)
        .map_err(|e| {
            (
                StatusCode::UNAUTHORIZED,
                axum::Json(serde_json::json!({
                    "error": format!("Token validation failed: {}", e)
                })),
            )
        })?;

    // Extract user information from claims
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| {
            (
                StatusCode::UNAUTHORIZED,
                axum::Json(serde_json::json!({
                    "error": "Invalid user ID in token"
                })),
            )
        })?;

    // Get request ID from extensions (set by request_id_middleware)
    let request_id = request.extensions()
        .get::<String>()
        .cloned()
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    // Create request context
    let context = RequestContext::new(
        request_id,
        user_id,
        claims.email,
        claims.role,
        claims.permissions.unwrap_or_default(),
    );

    // Insert context into request extensions for handlers to use
    request.extensions_mut().insert(context);

    let response = next.run(request).await;
    Ok(response)
}

