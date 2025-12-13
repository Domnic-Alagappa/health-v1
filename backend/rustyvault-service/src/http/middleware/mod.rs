//! Middleware for vault HTTP layer

pub mod auth_middleware;

pub use auth_middleware::{auth_middleware, extract_token, AuthInfo};

