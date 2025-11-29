use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Encryption error: {0}")]
    Encryption(String),

    #[error("Authentication error: {0}")]
    Authentication(String),

    #[error("Authorization error: {0}")]
    Authorization(String),

    #[error("Configuration error: {0}")]
    Configuration(String),

    #[error("Storage error: {0}")]
    Storage(String),

    #[error("Validation error: {0}")]
    Validation(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorKind {
    Database,
    Encryption,
    Authentication,
    Authorization,
    Configuration,
    Storage,
    Validation,
    NotFound,
    Internal,
}

impl From<AppError> for ErrorKind {
    fn from(err: AppError) -> Self {
        match err {
            AppError::Database(_) => ErrorKind::Database,
            AppError::Encryption(_) => ErrorKind::Encryption,
            AppError::Authentication(_) => ErrorKind::Authentication,
            AppError::Authorization(_) => ErrorKind::Authorization,
            AppError::Configuration(_) => ErrorKind::Configuration,
            AppError::Storage(_) => ErrorKind::Storage,
            AppError::Validation(_) => ErrorKind::Validation,
            AppError::NotFound(_) => ErrorKind::NotFound,
            AppError::Internal(_) => ErrorKind::Internal,
        }
    }
}

