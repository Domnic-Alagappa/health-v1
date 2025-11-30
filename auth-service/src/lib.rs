// Library crate for auth-service
// Exports modules for use by binaries and external crates

pub mod config;
pub mod shared;
pub mod domain;
pub mod infrastructure;
pub mod application;
pub mod presentation;

// Re-export commonly used types
pub use config::Settings;
pub use shared::{AppError, AppResult};

