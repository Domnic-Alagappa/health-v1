//! HTTP layer using Axum
//!
//! Migrated from Actix-web to Axum for consistency with health-v1

pub mod routes;
pub mod handlers;
pub mod middleware;

pub use routes::create_router;

