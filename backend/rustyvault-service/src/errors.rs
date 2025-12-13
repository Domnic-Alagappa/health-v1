//! Error types for RustyVault service
//!
//! Integrates health-v1 error patterns with RustyVault-specific errors
//! VaultError extends AppError with vault-specific error variants

use thiserror::Error;

/// Main error type for RustyVault service
/// Extends shared::AppError with vault-specific error types
#[derive(Error, Debug)]
pub enum VaultError {
    // Vault-specific errors
    #[error("Vault error: {0}")]
    Vault(String),

    #[error("Seal error: {0}")]
    Seal(String),

    #[error("Unseal error: {0}")]
    Unseal(String),

    #[error("Barrier error: {0}")]
    Barrier(String),

    // Shared error types (integrated from AppError)
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Storage error: {0}")]
    Storage(String),

    #[error("Authentication error: {0}")]
    Auth(String),

    #[error("Authorization error: {0}")]
    Authorization(String),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Encryption error: {0}")]
    Encryption(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

/// Convert from shared::AppError to VaultError
impl From<shared::AppError> for VaultError {
    fn from(err: shared::AppError) -> Self {
        match err {
            shared::AppError::Database(e) => VaultError::Database(e),
            shared::AppError::Encryption(msg) => VaultError::Encryption(msg),
            shared::AppError::Authentication(msg) => VaultError::Auth(msg),
            shared::AppError::Authorization(msg) => VaultError::Authorization(msg),
            shared::AppError::Configuration(msg) => VaultError::Config(msg),
            shared::AppError::Storage(msg) => VaultError::Storage(msg),
            shared::AppError::Validation(msg) => VaultError::Validation(msg),
            shared::AppError::NotFound(msg) => VaultError::NotFound(msg),
            shared::AppError::Internal(msg) => VaultError::Internal(msg),
        }
    }
}

impl From<anyhow::Error> for VaultError {
    fn from(err: anyhow::Error) -> Self {
        VaultError::Internal(err.to_string())
    }
}

/// Result type alias
pub type VaultResult<T> = Result<T, VaultError>;

