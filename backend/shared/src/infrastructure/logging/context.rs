use crate::shared::RequestContext;
use tracing::span;
use uuid::Uuid;

/// Structured logging context
#[derive(Debug, Clone)]
pub struct LogContext {
    pub request_id: Option<String>,
    pub user_id: Option<Uuid>,
    pub operation: Option<String>,
    pub resource: Option<String>,
    pub resource_id: Option<String>,
}

impl LogContext {
    pub fn new() -> Self {
        Self {
            request_id: None,
            user_id: None,
            operation: None,
            resource: None,
            resource_id: None,
        }
    }

    pub fn with_request_id(mut self, request_id: String) -> Self {
        self.request_id = Some(request_id);
        self
    }

    pub fn with_user_id(mut self, user_id: Uuid) -> Self {
        self.user_id = Some(user_id);
        self
    }

    pub fn with_operation(mut self, operation: String) -> Self {
        self.operation = Some(operation);
        self
    }

    pub fn with_resource(mut self, resource: String) -> Self {
        self.resource = Some(resource);
        self
    }

    pub fn with_resource_id(mut self, resource_id: String) -> Self {
        self.resource_id = Some(resource_id);
        self
    }

    pub fn from_request_context(context: &RequestContext) -> Self {
        Self {
            request_id: Some(context.request_id.clone()),
            user_id: Some(context.user_id),
            operation: None,
            resource: None,
            resource_id: None,
        }
    }
}

impl Default for LogContext {
    fn default() -> Self {
        Self::new()
    }
}

/// Helper function to log errors with structured fields
pub fn log_error(error: &crate::shared::AppError, location: &str) {
    use tracing::error;
    error!(
        error = %error,
        error_kind = ?crate::shared::ErrorKind::from(error),
        location = location,
        "Error occurred"
    );
}

/// Helper function to log errors with context
pub fn log_error_with_context(
    error: &crate::shared::AppError,
    context: &LogContext,
    location: &str,
) {
    use tracing::error;
    error!(
        error = %error,
        error_kind = ?crate::shared::ErrorKind::from(error),
        location = location,
        request_id = ?context.request_id,
        user_id = ?context.user_id,
        operation = ?context.operation,
        resource = ?context.resource,
        resource_id = ?context.resource_id,
        "Error occurred"
    );
}

/// Create a tracing span with request context
pub fn span_with_context(_name: &'static str, context: &LogContext) -> tracing::Span {
    // Create span with fields from context
    // Note: We use a simple approach - the span will be created and fields can be added via enter()
    let span = tracing::span!(tracing::Level::INFO, "operation");
    if let Some(ref request_id) = context.request_id {
        span.record("request_id", request_id.as_str());
    }
    if let Some(user_id) = context.user_id {
        span.record("user_id", &tracing::field::display(user_id));
    }
    if let Some(ref operation) = context.operation {
        span.record("operation", operation.as_str());
    }
    if let Some(ref resource) = context.resource {
        span.record("resource", resource.as_str());
    }
    if let Some(ref resource_id) = context.resource_id {
        span.record("resource_id", resource_id.as_str());
    }
    span
}

/// Create a tracing span from RequestContext
pub fn span_from_request_context(_name: &'static str, context: &RequestContext) -> tracing::Span {
    span!(
        tracing::Level::INFO,
        "request",
        request_id = %context.request_id,
        user_id = %context.user_id,
        email = %context.email,
    )
}

