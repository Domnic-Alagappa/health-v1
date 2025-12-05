use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
    http::StatusCode,
};
use std::sync::Arc;
use uuid::Uuid;
use shared::RequestContext;
use shared::domain::repositories::UserRepository;
use shared::infrastructure::repositories::UserRepositoryImpl;
use super::super::AppState;
use super::session_middleware::{get_session, get_app_type, get_app_device};

/// Hybrid authentication middleware that supports both session-based and JWT token authentication.
/// 
/// Priority:
/// 1. Check for authenticated session (for web UIs using cookies)
/// 2. Fall back to JWT token validation (for mobile/API clients)
pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    mut request: Request,
    next: Next,
) -> Result<Response, (StatusCode, axum::Json<serde_json::Value>)> {
    // Get request ID from extensions (set by request_id_middleware)
    let request_id = request.extensions()
        .get::<String>()
        .cloned()
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    // Get app type and device from request (set by session_middleware)
    let request_app_type = get_app_type(&request);
    let request_app_device = get_app_device(&request);

    // Priority 1: Check for authenticated session (session-based auth for web UIs)
    if let Some(session) = get_session(&request) {
        if !session.is_ghost_session() {
            // Validate session app_type matches request app_type (if both are set)
            if let Some(req_app_type) = &request_app_type {
                if session.app_type != *req_app_type {
                    return Err((
                        StatusCode::FORBIDDEN,
                        axum::Json(serde_json::json!({
                            "error": format!("Session app_type mismatch: expected {}, got {}", req_app_type, session.app_type)
                        })),
                    ));
                }
            }

            // Apply app-specific security policies
            if session.is_admin_ui() {
                // Admin UI: Stricter validation - require recent activity (within last hour)
                let inactivity_threshold = chrono::Utc::now() - chrono::Duration::hours(1);
                if session.last_activity_at < inactivity_threshold {
                    return Err((
                        StatusCode::UNAUTHORIZED,
                        axum::Json(serde_json::json!({
                            "error": "Session inactive for too long. Please log in again."
                        })),
                    ));
                }
            }

            // Session is authenticated - use it to create RequestContext
            if let Some(user_id) = session.user_id {
                // Fetch user info to get email, role, and permissions
                match state.userinfo_use_case.execute(user_id).await {
                    Ok(user_info) => {
                        let mut context = RequestContext::new(
                            request_id,
                            user_id,
                            user_info.email,
                            user_info.role,
                            user_info.permissions.unwrap_or_default(),
                        )
                        .with_session(session.id)
                        .with_ip_address(session.ip_address);

                        if let Some(org_id) = session.organization_id {
                            context = context.with_organization(org_id);
                        }

                        // Add app_type and app_device to context
                        if let Some(app_type) = request_app_type {
                            context = context.with_app_type(app_type);
                        }
                        if let Some(app_device) = request_app_device {
                            context = context.with_app_device(app_device);
                        }

                        request.extensions_mut().insert(context);
                        let response = next.run(request).await;
                        return Ok(response);
                    }
                    Err(e) => {
                        tracing::error!("Failed to fetch user info from session: {}", e);
                        // Fall through to JWT authentication
                    }
                }
            }
        }
    }

    // Priority 2: Fall back to JWT token authentication (for mobile/API clients)
    let auth_header = request.headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                axum::Json(serde_json::json!({
                    "error": "Missing Authorization header - no authenticated session or token provided"
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

    // Get user to retrieve organization_id
    let user_repository = UserRepositoryImpl::new(state.database_service.clone());
    let user = user_repository.find_by_id(user_id).await
        .map_err(|e| {
            tracing::error!("Failed to fetch user: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                axum::Json(serde_json::json!({
                    "error": "Failed to fetch user information"
                })),
            )
        })?;

    let organization_id = user.and_then(|u| u.organization_id);

    // Get session from extensions (set by session_middleware)
    if let Some(session) = get_session(&request) {
        // Authenticate the session if it's a ghost session
        if session.is_ghost_session() {
            if let Err(e) = state.session_service.authenticate_session(
                session.id,
                user_id,
                organization_id,
                request_app_type.as_deref(),
                request_app_device.as_deref(),
            ).await {
                tracing::warn!("Failed to authenticate session: {}", e);
                // Continue anyway - session will be authenticated on next request
            }
        }

        // Create request context with session information
        let mut context = RequestContext::new(
            request_id,
            user_id,
            claims.email,
            claims.role,
            claims.permissions.unwrap_or_default(),
        )
        .with_session(session.id)
        .with_ip_address(session.ip_address);

        if let Some(org_id) = organization_id {
            context = context.with_organization(org_id);
        }

        // Add app_type and app_device to context
        if let Some(app_type) = request_app_type {
            context = context.with_app_type(app_type);
        }
        if let Some(app_device) = request_app_device {
            context = context.with_app_device(app_device);
        }

        request.extensions_mut().insert(context);
    } else {
        // No session found - create context without session info
        let mut context = RequestContext::new(
            request_id,
            user_id,
            claims.email,
            claims.role,
            claims.permissions.unwrap_or_default(),
        );

        if let Some(org_id) = organization_id {
            context = context.with_organization(org_id);
        }

        // Add app_type and app_device to context
        if let Some(app_type) = request_app_type {
            context = context.with_app_type(app_type);
        }
        if let Some(app_device) = request_app_device {
            context = context.with_app_device(app_device);
        }

        request.extensions_mut().insert(context);
    }

    let response = next.run(request).await;
    Ok(response)
}
