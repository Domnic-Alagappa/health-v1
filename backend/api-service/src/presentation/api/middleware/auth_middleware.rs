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
use super::session_middleware::get_session;

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

        request.extensions_mut().insert(context);
    }

    let response = next.run(request).await;
    Ok(response)
}

