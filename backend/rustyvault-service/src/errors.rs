//! Error types for RustyVault service
//!
//! Integrates health-v1 error patterns with RustyVault-specific errors

use thiserror::Error;

/// Main error type for RustyVault service
#[derive(Error, Debug)]
pub enum VaultError {
    #[error("Vault error: {0}")]
    Vault(String),

    #[error("Storage error: {0}")]
    Storage(String),

    #[error("Authentication error: {0}")]
    Auth(String),

    #[error("Authorization error: {0}")]
    Authorization(String),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl From<anyhow::Error> for VaultError {
    fn from(err: anyhow::Error) -> Self {
        VaultError::Internal(err.to_string())
    }
}

/// Result type alias
pub type VaultResult<T> = Result<T, VaultError>;

