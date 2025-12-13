//! Route definitions for vault API

use axum::{
    Router,
    middleware,
};
use std::sync::Arc;
use crate::http::handlers::{sys_handlers, secrets_handlers, policy_handlers, auth_handlers};
use crate::http::middleware::auth_middleware;
use crate::modules::auth::{TokenStore, UserPassBackend};
use crate::modules::policy::PolicyStore;

/// App state for routes
pub struct AppState {
    pub core: Arc<crate::core::VaultCore>,
    pub policy_store: Option<Arc<PolicyStore>>,
    pub token_store: Option<Arc<TokenStore>>,
    pub userpass: Option<Arc<UserPassBackend>>,
}

/// Create the vault API router
/// Using closures to capture state (no State extractor needed)
pub fn create_router(state: Arc<AppState>) -> Router {
    // Public routes (no auth required)
    let state_clone = state.clone();
    let public_routes = Router::new()
        .route("/v1/sys/health", axum::routing::get(sys_handlers::health_check))
        .route("/v1/sys/init", axum::routing::post({
            let state = state_clone.clone();
            move |payload: axum::extract::Json<serde_json::Value>| {
                let state = state.clone();
                async move {
                    sys_handlers::init_with_state(state, payload).await
                }
            }
        }))
        // Unseal can be called without auth when vault is sealed
        .route("/v1/sys/unseal", axum::routing::post({
            let state = state_clone.clone();
            move |payload: axum::extract::Json<serde_json::Value>| {
                let state = state.clone();
                async move {
                    sys_handlers::unseal_with_state(state, payload).await
                }
            }
        }))
        .route("/v1/sys/seal-status", axum::routing::get({
            let state = state_clone.clone();
            move || {
                let state = state.clone();
                async move {
                    sys_handlers::seal_status_with_state(state).await
                }
            }
        }))
        // UserPass login doesn't require auth
        .route("/v1/auth/userpass/login/:username", axum::routing::post({
            let state = state_clone.clone();
            move |path: axum::extract::Path<String>, payload: axum::extract::Json<serde_json::Value>| {
                let state = state.clone();
                let username = path.0;
                async move {
                    auth_handlers::userpass_login(state, username, payload).await
                }
            }
        }));
    
    // Protected routes (auth required)
    let state_clone2 = state.clone();
    let protected_routes = Router::new()
        // System routes
        .route("/v1/sys/seal", axum::routing::post({
            let state = state_clone2.clone();
            move || {
                let state = state.clone();
                async move {
                    sys_handlers::seal_with_state(state).await
                }
            }
        }))
        
        // ============================================================
        // Secrets routes
        // ============================================================
        .route("/v1/secret/*path", axum::routing::get({
            let state = state_clone2.clone();
            move |path: axum::extract::Path<String>| {
                let state = state.clone();
                let path_str = path.0;
                async move {
                    secrets_handlers::read_secret_with_state(state, path_str).await
                }
            }
        }))
        .route("/v1/secret/*path", axum::routing::post({
            let state = state_clone2.clone();
            move |path: axum::extract::Path<String>, payload: axum::extract::Json<serde_json::Value>| {
                let state = state.clone();
                let path_str = path.0;
                async move {
                    secrets_handlers::write_secret_with_state(state, path_str, payload).await
                }
            }
        }))
        .route("/v1/secret/*path", axum::routing::delete({
            let state = state_clone2.clone();
            move |path: axum::extract::Path<String>| {
                let state = state.clone();
                let path_str = path.0;
                async move {
                    secrets_handlers::delete_secret_with_state(state, path_str).await
                }
            }
        }))
        
        // ============================================================
        // Policy routes
        // ============================================================
        .route("/v1/sys/policies/acl", axum::routing::get({
            let state = state_clone2.clone();
            move || {
                let state = state.clone();
                async move {
                    policy_handlers::list_policies(state).await
                }
            }
        }))
        .route("/v1/sys/policies/acl/:name", axum::routing::get({
            let state = state_clone2.clone();
            move |path: axum::extract::Path<String>| {
                let state = state.clone();
                let name = path.0;
                async move {
                    policy_handlers::read_policy(state, name).await
                }
            }
        }))
        .route("/v1/sys/policies/acl/:name", axum::routing::post({
            let state = state_clone2.clone();
            move |path: axum::extract::Path<String>, payload: axum::extract::Json<serde_json::Value>| {
                let state = state.clone();
                let name = path.0;
                async move {
                    policy_handlers::write_policy(state, name, payload).await
                }
            }
        }))
        .route("/v1/sys/policies/acl/:name", axum::routing::delete({
            let state = state_clone2.clone();
            move |path: axum::extract::Path<String>| {
                let state = state.clone();
                let name = path.0;
                async move {
                    policy_handlers::delete_policy(state, name).await
                }
            }
        }))
        .route("/v1/sys/capabilities", axum::routing::post({
            let state = state_clone2.clone();
            move |payload: axum::extract::Json<serde_json::Value>| {
                let state = state.clone();
                async move {
                    policy_handlers::check_capabilities(state, payload).await
                }
            }
        }))
        
        // ============================================================
        // Token routes
        // ============================================================
        .route("/v1/auth/token/create", axum::routing::post({
            let state = state_clone2.clone();
            move |payload: axum::extract::Json<serde_json::Value>| {
                let state = state.clone();
                async move {
                    auth_handlers::create_token(state, payload).await
                }
            }
        }))
        .route("/v1/auth/token/lookup", axum::routing::post({
            let state = state_clone2.clone();
            move |payload: axum::extract::Json<serde_json::Value>| {
                let state = state.clone();
                async move {
                    auth_handlers::lookup_token(state, payload).await
                }
            }
        }))
        .route("/v1/auth/token/lookup-self", axum::routing::get({
            let state = state_clone2.clone();
            move |headers: axum::http::HeaderMap| {
                let state = state.clone();
                let token = headers
                    .get("X-Vault-Token")
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("")
                    .to_string();
                async move {
                    auth_handlers::lookup_self_token(state, token).await
                }
            }
        }))
        .route("/v1/auth/token/renew", axum::routing::post({
            let state = state_clone2.clone();
            move |payload: axum::extract::Json<serde_json::Value>| {
                let state = state.clone();
                async move {
                    auth_handlers::renew_token(state, payload).await
                }
            }
        }))
        .route("/v1/auth/token/revoke", axum::routing::post({
            let state = state_clone2.clone();
            move |payload: axum::extract::Json<serde_json::Value>| {
                let state = state.clone();
                async move {
                    auth_handlers::revoke_token(state, payload).await
                }
            }
        }))
        .route("/v1/auth/token/revoke-self", axum::routing::post({
            let state = state_clone2.clone();
            move |headers: axum::http::HeaderMap| {
                let state = state.clone();
                let token = headers
                    .get("X-Vault-Token")
                    .and_then(|v| v.to_str().ok())
                    .unwrap_or("")
                    .to_string();
                async move {
                    auth_handlers::revoke_self_token(state, token).await
                }
            }
        }))
        
        // ============================================================
        // UserPass routes
        // ============================================================
        .route("/v1/auth/userpass/users", axum::routing::get({
            let state = state_clone2.clone();
            move || {
                let state = state.clone();
                async move {
                    auth_handlers::list_userpass_users(state).await
                }
            }
        }))
        .route("/v1/auth/userpass/users/:username", axum::routing::post({
            let state = state_clone2.clone();
            move |path: axum::extract::Path<String>, payload: axum::extract::Json<serde_json::Value>| {
                let state = state.clone();
                let username = path.0;
                async move {
                    auth_handlers::create_userpass_user(state, username, payload).await
                }
            }
        }))
        .route("/v1/auth/userpass/users/:username", axum::routing::get({
            let state = state_clone2.clone();
            move |path: axum::extract::Path<String>| {
                let state = state.clone();
                let username = path.0;
                async move {
                    auth_handlers::read_userpass_user(state, username).await
                }
            }
        }))
        .route("/v1/auth/userpass/users/:username", axum::routing::delete({
            let state = state_clone2.clone();
            move |path: axum::extract::Path<String>| {
                let state = state.clone();
                let username = path.0;
                async move {
                    auth_handlers::delete_userpass_user(state, username).await
                }
            }
        }))
        
        .layer(middleware::from_fn({
            let state = state.clone();
            move |req: axum::extract::Request, next: axum::middleware::Next| {
                let state = state.clone();
                async move {
                    auth_middleware(state, req, next).await
                }
            }
        }));
    
    Router::new()
        .merge(public_routes)
        .merge(protected_routes)
}
