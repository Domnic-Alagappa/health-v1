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
    let public_routes = Router::new()
        .route("/health", get(health_check))
        .route("/auth/login", post(login))
        .route("/api/setup/status", get(check_setup_status))
        .route("/api/setup/initialize", post(initialize_setup))
        .route("/api/services/status", get(get_service_status));

    // Protected routes (authentication required)
    // Apply auth middleware first, then ACL middleware
    // The state will be provided when .with_state() is called on the router
    // Note: Middleware will be applied via route_layer in main.rs after state is set
    let protected_routes = Router::new()
        .route("/auth/logout", post(logout))
        .route("/auth/token", post(refresh_token))
        .route("/auth/userinfo", get(userinfo))
        .route("/users", post(create_user))
        .route("/users/:id", get(get_user))
        .route("/users/:id", post(update_user))
        .route("/users/:id", delete(delete_user));

    Router::new()
        .merge(public_routes)
        .merge(protected_routes)
}

#[allow(dead_code)]
async fn health_check() -> &'static str {
    "OK"
}
