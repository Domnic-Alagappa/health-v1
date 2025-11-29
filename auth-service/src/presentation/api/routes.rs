use axum::{
    Router,
    routing::{get, post, delete},
};
use crate::presentation::api::handlers::*;

pub fn create_router() -> Router {
    Router::new()
        .route("/health", get(health_check))
        .route("/auth/login", post(login))
        .route("/auth/logout", post(logout))
        .route("/auth/token", post(refresh_token))
        .route("/auth/userinfo", get(userinfo))
        .route("/users", post(create_user))
        .route("/users/:id", get(get_user))
        .route("/users/:id", post(update_user))
        .route("/users/:id", delete(delete_user))
}

async fn health_check() -> &'static str {
    "OK"
}

