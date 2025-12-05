use thiserror::Error;
use crate::infrastructure::logging::context::LogContext;

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

impl From<&AppError> for ErrorKind {
    fn from(err: &AppError) -> Self {
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

impl AppError {
    /// Log this error with structured fields
    /// 
    /// # Arguments
    /// * `location` - The location where the error occurred (e.g., "file.rs:123")
    pub fn log(&self, location: &str) {
        use tracing::error;
        error!(
            error = %self,
            error_kind = ?ErrorKind::from(self),
            location = location,
            "Error occurred"
        );
    }

    /// Log this error with additional context
    /// 
    /// # Arguments
    /// * `location` - The location where the error occurred (e.g., "file.rs:123")
    /// * `context` - Additional logging context (request_id, user_id, etc.)
    pub fn log_with_context(&self, location: &str, context: &LogContext) {
        use tracing::error;
        error!(
            error = %self,
            error_kind = ?ErrorKind::from(self),
            location = location,
            request_id = ?context.request_id,
            user_id = ?context.user_id,
            operation = ?context.operation,
            resource = ?context.resource,
            resource_id = ?context.resource_id,
            "Error occurred"
        );
    }

    /// Log this error with operation context
    /// 
    /// # Arguments
    /// * `location` - The location where the error occurred (e.g., "file.rs:123")
    /// * `operation` - The operation that failed (e.g., "login", "create_user")
    pub fn log_with_operation(&self, location: &str, operation: &str) {
        use tracing::error;
        error!(
            error = %self,
            error_kind = ?ErrorKind::from(self),
            location = location,
            operation = operation,
            "Error occurred"
        );
    }

    /// Get the error kind for this error
    pub fn kind(&self) -> ErrorKind {
        ErrorKind::from(self)
    }
}

