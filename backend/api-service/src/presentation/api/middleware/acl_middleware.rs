use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
    http::StatusCode,
};
use std::sync::Arc;
use shared::RequestContext;
use api_service::AppState;

/// ACL middleware that checks permissions using both role-based and Zanzibar relationship-based authorization
/// 
/// This middleware expects:
/// 1. RequestContext to be set by auth_middleware (user must be authenticated)
/// 2. Optional permission requirements via route metadata or query params
pub async fn acl_middleware(
    State(state): State<Arc<AppState>>,
    request: Request,
    next: Next,
) -> Result<Response, (StatusCode, axum::Json<serde_json::Value>)> {
    // Get request context (set by auth_middleware)
    let context = request.extensions()
        .get::<RequestContext>()
        .ok_or_else(|| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                axum::Json(serde_json::json!({
                    "error": "Request context not found - authentication middleware must run first"
                })),
            )
        })?;

    // Extract permission requirements from request
    // This can come from route metadata, query params, or headers
    // For now, we'll check if a permission is required via query param or header
    let required_permission = request
        .uri()
        .query()
        .and_then(|q| {
            q.split('&')
                .find_map(|pair| {
                    if pair.starts_with("required_permission=") {
                        Some(pair.trim_start_matches("required_permission="))
                    } else {
                        None
                    }
                })
        })
        .or_else(|| {
            request.headers()
                .get("X-Required-Permission")
                .and_then(|h| h.to_str().ok())
        });

    // If a specific permission is required, check it
    if let Some(permission) = required_permission {
        // First check role-based permissions
        if !context.has_permission(permission) {
            // Then check Zanzibar relationships
            let user_id_str = context.user_id.to_string();
            let resource = request.uri().path();
            
            // Try common relations: viewer, editor, owner
            let has_access = state.permission_checker.check(&user_id_str, "viewer", resource).await
                .unwrap_or(false)
                || state.permission_checker.check(&user_id_str, "editor", resource).await
                .unwrap_or(false)
                || state.permission_checker.check(&user_id_str, "owner", resource).await
                .unwrap_or(false);

            if !has_access {
                // Log access denied for audit
                tracing::warn!(
                    "Access denied: user {} attempted to access {} without permission {}",
                    context.user_id,
                    resource,
                    permission
                );

                return Err((
                    StatusCode::FORBIDDEN,
                    axum::Json(serde_json::json!({
                        "error": "Access denied",
                        "message": format!("You do not have permission: {}", permission),
                        "resource": resource,
                    })),
                ));
            }
        }
    }

    // Check resource-based permissions if resource ID is in path
    // This allows checking permissions on specific resources like /users/:id
    if let Some(resource_id) = extract_resource_id(&request) {
        let user_id_str = context.user_id.to_string();
        
        // Check if user has any relationship with the resource
        // This is a basic check - can be enhanced with specific relations
        let has_relationship = state.permission_checker.check(&user_id_str, "viewer", &resource_id).await
            .unwrap_or(false)
            || state.permission_checker.check(&user_id_str, "editor", &resource_id).await
            .unwrap_or(false)
            || state.permission_checker.check(&user_id_str, "owner", &resource_id).await
            .unwrap_or(false);

        // If user has no relationship and is not the owner/admin, deny access
        if !has_relationship && context.user_id.to_string() != resource_id && !context.has_role("admin") {
            // Allow if user has role-based permission
            if !context.has_permission("users.view") {
                tracing::warn!(
                    "Access denied: user {} attempted to access resource {} without relationship",
                    context.user_id,
                    resource_id
                );

                return Err((
                    StatusCode::FORBIDDEN,
                    axum::Json(serde_json::json!({
                        "error": "Access denied",
                        "message": "You do not have access to this resource",
                        "resource_id": resource_id,
                    })),
                ));
            }
        }
    }

    let response = next.run(request).await;
    Ok(response)
}

/// Extract resource ID from request path (e.g., /users/:id -> id)
fn extract_resource_id(request: &Request) -> Option<String> {
    let path = request.uri().path();
    
    // Try to extract ID from common patterns
    // Pattern: /users/{id} or /users/{id}/...
    if path.starts_with("/users/") {
        let parts: Vec<&str> = path.split('/').collect();
        if parts.len() >= 3 {
            return Some(parts[2].to_string());
        }
    }
    
    // Pattern: /patients/{id} or /patients/{id}/...
    if path.starts_with("/patients/") {
        let parts: Vec<&str> = path.split('/').collect();
        if parts.len() >= 3 {
            return Some(parts[2].to_string());
        }
    }
    
    None
}

