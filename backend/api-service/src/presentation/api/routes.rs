use axum::{
    Router,
    routing::{get, post, delete},
};
use crate::presentation::api::handlers::*;
use admin_service::handlers::*;
use std::sync::Arc;

#[allow(dead_code)]
pub fn create_router() -> Router<Arc<super::AppState>> {
    // Public routes (no authentication required)
    // All routes use /v1/ prefix for versioning (except /health)
    let public_routes = Router::new()
        .route("/health", get(health_check)) // Health check stays unversioned
        .route("/v1/auth/login", post(login))
        .route("/v1/setup/status", get(check_setup_status))
        .route("/v1/setup/initialize", post(initialize_setup))
        .route("/v1/services/status", get(get_service_status));

    // Protected routes (authentication required)
    // Apply auth middleware first, then ACL middleware
    // The state will be provided when .with_state() is called on the router
    // Note: Middleware will be applied via route_layer in main.rs after state is set
    // All routes use /v1/ prefix for versioning
    let protected_routes = Router::new()
        .route("/v1/auth/logout", post(logout))
        .route("/v1/auth/token", post(refresh_token))
        .route("/v1/auth/userinfo", get(userinfo))
        .route("/v1/users", post(create_user))
        .route("/v1/users/:id", get(get_user))
        .route("/v1/users/:id", post(update_user))
        .route("/v1/users/:id", delete(delete_user));

    Router::new()
        .merge(public_routes)
        .merge(protected_routes)
}

#[allow(dead_code)]
async fn health_check() -> &'static str {
    "OK"
}
