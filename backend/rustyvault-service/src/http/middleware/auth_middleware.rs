//! Authentication middleware for vault API
//!
//! This middleware:
//! 1. Extracts the token from headers
//! 2. Validates the token against the TokenStore
//! 3. Checks ACL policies for the requested path
//! 4. Attaches token info to request for handlers

use axum::{
    extract::Request,
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use std::sync::Arc;

use crate::http::routes::AppState;
use crate::modules::auth::TokenEntry;
use crate::logical::request::Operation;

/// Token information attached to requests after authentication
#[derive(Clone, Debug)]
pub struct AuthInfo {
    pub token: TokenEntry,
    pub raw_token: String,
}

/// Extract token from headers
pub fn extract_token(headers: &HeaderMap) -> Option<String> {
    // Check X-Vault-Token header (HashiCorp Vault compatible)
    if let Some(token) = headers.get("X-Vault-Token") {
        return token.to_str().ok().map(|s| s.to_string());
    }

    // Check X-RustyVault-Token header 
    if let Some(token) = headers.get("X-RustyVault-Token") {
        return token.to_str().ok().map(|s| s.to_string());
    }

    // Check Authorization header
    if let Some(auth) = headers.get("Authorization") {
        if let Ok(auth_str) = auth.to_str() {
            if auth_str.starts_with("Bearer ") {
                return Some(auth_str[7..].to_string());
            }
        }
    }

    None
}

/// Paths that don't require authentication
const PUBLIC_PATHS: &[&str] = &[
    "/v1/sys/health",
    "/v1/sys/init",
    "/v1/sys/seal-status",
    "/v1/sys/unseal",
];

/// Paths that require authentication but always allowed (for token lookup)
const SELF_PATHS: &[&str] = &[
    "/v1/auth/token/lookup-self",
    "/v1/auth/token/renew-self",
    "/v1/auth/token/revoke-self",
];

/// Convert HTTP method to Operation
fn method_to_operation(method: &str) -> Operation {
    match method {
        "GET" => Operation::Read,
        "POST" | "PUT" => Operation::Write,
        "DELETE" => Operation::Delete,
        "LIST" => Operation::List,
        _ => Operation::Read,
    }
}

/// Authentication middleware
pub async fn auth_middleware(
    state: Arc<AppState>,
    mut req: Request,
    next: Next,
) -> Result<Response, Response> {
    let path = req.uri().path().to_string();
    let method = req.method().as_str().to_string();

    // Allow public paths without auth
    if PUBLIC_PATHS.iter().any(|p| path.starts_with(p)) {
        return Ok(next.run(req).await);
    }

    // Allow userpass login without auth
    if path.starts_with("/v1/auth/userpass/login/") {
        return Ok(next.run(req).await);
    }

    // Extract token
    let raw_token = extract_token(req.headers()).ok_or_else(|| {
        (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "missing authentication token" })),
        )
            .into_response()
    })?;

    if raw_token.is_empty() {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "empty authentication token" })),
        )
            .into_response());
    }

    // Validate token against TokenStore
    let token_entry = if let Some(token_store) = &state.token_store {
        match token_store.lookup_token(&raw_token).await {
            Ok(Some(entry)) => entry,
            Ok(None) => {
                return Err((
                    StatusCode::UNAUTHORIZED,
                    Json(json!({ "error": "invalid or expired token" })),
                )
                    .into_response());
            }
            Err(e) => {
                tracing::error!("Token lookup failed: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "error": "failed to validate token" })),
                )
                    .into_response());
            }
        }
    } else {
        // Token store not available - allow with basic check
        tracing::warn!("Token store not available, skipping token validation");
        // Create a minimal token entry for compatibility
        TokenEntry {
            id: uuid::Uuid::new_v4(),
            token_hash: String::new(),
            display_name: "unknown".to_string(),
            policies: vec!["default".to_string()],
            parent: None,
            ttl: 0,
            expires_at: None,
            created_at: chrono::Utc::now(),
            last_used_at: None,
            num_uses: 0,
            path: String::new(),
            meta: None,
            renewable: false,
            entity_id: None,
        }
    };

    // Check if token has uses remaining
    if token_entry.num_uses > 0 {
        // Decrement uses
        if let Some(token_store) = &state.token_store {
            if let Err(e) = token_store.use_token(token_entry.id).await {
                tracing::error!("Failed to update token usage: {}", e);
            }
        }
    }

    // Allow self-paths for any authenticated token
    if SELF_PATHS.iter().any(|p| path == *p) {
        // Attach auth info to request
        let auth_info = AuthInfo {
            token: token_entry,
            raw_token,
        };
        req.extensions_mut().insert(auth_info);
        return Ok(next.run(req).await);
    }

    // Root policy bypasses all ACL checks
    if token_entry.policies.contains(&"root".to_string()) {
        let auth_info = AuthInfo {
            token: token_entry,
            raw_token,
        };
        req.extensions_mut().insert(auth_info);
        return Ok(next.run(req).await);
    }

    // Check ACL policies
    if let Some(policy_store) = &state.policy_store {
        let operation = method_to_operation(&method);
        
        // Convert path to vault path (remove /v1/ prefix)
        let vault_path = path.trim_start_matches("/v1/").to_string();

        // Build ACL from token's policies
        match policy_store.new_acl(&token_entry.policies).await {
            Ok(acl) => {
                // Create a request for ACL checking
                let acl_req = crate::logical::Request {
                    path: vault_path.clone(),
                    operation,
                    ..Default::default()
                };

                match acl.allow_operation(&acl_req, false) {
                    Ok(result) => {
                        if !result.allowed {
                            tracing::warn!(
                                "Access denied for path '{}' with policies {:?}",
                                vault_path,
                                token_entry.policies
                            );
                            return Err((
                                StatusCode::FORBIDDEN,
                                Json(json!({ 
                                    "error": "permission denied",
                                    "path": vault_path,
                                    "operation": format!("{:?}", operation)
                                })),
                            )
                                .into_response());
                        }
                    }
                    Err(e) => {
                        tracing::error!("ACL check failed: {}", e);
                        return Err((
                            StatusCode::INTERNAL_SERVER_ERROR,
                            Json(json!({ "error": "failed to check permissions" })),
                        )
                            .into_response());
                    }
                }
            }
            Err(e) => {
                tracing::error!("Failed to build ACL: {}", e);
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "error": "failed to load policies" })),
                )
                    .into_response());
            }
        }
    } else {
        tracing::warn!("Policy store not available, skipping ACL check");
    }

    // Attach auth info to request for handlers
    let auth_info = AuthInfo {
        token: token_entry,
        raw_token,
    };
    req.extensions_mut().insert(auth_info);

    Ok(next.run(req).await)
}
