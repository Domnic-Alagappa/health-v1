use axum::{
    extract::Request,
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use shared::infrastructure::zanzibar::PermissionChecker;
use std::sync::Arc;

/// Middleware to check if user can access the app
/// Checks X-App-Name header and verifies user has access via Zanzibar
pub async fn app_access_middleware(
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Get app name from header
    let app_name = headers
        .get("X-App-Name")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| {
            tracing::warn!("X-App-Name header missing");
            StatusCode::BAD_REQUEST
        })?;

    // Get user from request extensions (set by auth middleware)
    let user_id = request
        .extensions()
        .get::<uuid::Uuid>()
        .copied()
        .ok_or_else(|| {
            tracing::warn!("User ID not found in request extensions");
            StatusCode::UNAUTHORIZED
        })?;

    // Get permission checker from request extensions
    let permission_checker = request
        .extensions()
        .get::<Arc<PermissionChecker>>()
        .ok_or_else(|| {
            tracing::error!("Permission checker not found in request extensions");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // Check if user can access the app
    let user_str = format!("user:{}", user_id);
    match permission_checker.can_access_app(&user_str, app_name).await {
        Ok(true) => {
            // User has access, continue
            Ok(next.run(request).await)
        }
        Ok(false) => {
            tracing::warn!("User {} denied access to app {}", user_id, app_name);
            Err(StatusCode::FORBIDDEN)
        }
        Err(e) => {
            tracing::error!("Error checking app access: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

