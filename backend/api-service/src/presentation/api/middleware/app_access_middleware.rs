use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use shared::infrastructure::zanzibar::PermissionChecker;
use shared::infrastructure::repositories::UserRepositoryImpl;
use shared::domain::repositories::UserRepository;
use shared::RequestContext;
use std::sync::Arc;
use super::super::AppState;

/// Middleware to check if user can access the app
/// Checks X-App-Name header and verifies user has access via Zanzibar with organization scoping
#[allow(dead_code)]
pub async fn app_access_middleware(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    request: Request,
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

    // Get request context (set by auth middleware)
    let context = request
        .extensions()
        .get::<RequestContext>()
        .ok_or_else(|| {
            tracing::warn!("Request context not found in request extensions");
            StatusCode::UNAUTHORIZED
        })?;

    let user_id = context.user_id;

    // Get user's organization_id from database
    let user_repository = UserRepositoryImpl::new(state.database_service.clone());
    let user = user_repository
        .find_by_id(user_id)
        .await
        .map_err(|e| {
            tracing::error!("Failed to fetch user: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let organization_id = user
        .and_then(|u| u.organization_id)
        .ok_or_else(|| {
            tracing::warn!("User {} has no organization_id", user_id);
            StatusCode::FORBIDDEN
        })?;

    // Get permission checker from request extensions
    let permission_checker = request
        .extensions()
        .get::<Arc<PermissionChecker>>()
        .ok_or_else(|| {
            tracing::error!("Permission checker not found in request extensions");
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    // Check if user can access the app within their organization
    let user_str = format!("user:{}", user_id);
    match permission_checker.can_access_app_with_org(&user_str, app_name, organization_id).await {
        Ok(true) => {
            // User has access, continue
            Ok(next.run(request).await)
        }
        Ok(false) => {
            tracing::warn!("User {} denied access to app {} in organization {}", user_id, app_name, organization_id);
            Err(StatusCode::FORBIDDEN)
        }
        Err(e) => {
            tracing::error!("Error checking app access: {}", e);
            Err(StatusCode::INTERNAL_SERVER_ERROR)
        }
    }
}

