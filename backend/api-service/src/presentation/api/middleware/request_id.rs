use axum::{
    extract::Request,
    middleware::Next,
    response::Response,
    http::HeaderValue,
};
use uuid::Uuid;

/// Middleware that generates a unique request ID for each request
/// Adds X-Request-ID header to both request and response
/// Also creates a tracing span with request_id for all logs within the request
pub async fn request_id_middleware(
    mut request: Request,
    next: Next,
) -> Response {
    // Generate or extract request ID
    let request_id = request.headers()
        .get("X-Request-ID")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string())
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    // Add request ID to request extensions for handlers to use
    request.extensions_mut().insert(request_id.clone());

    // Create a tracing span with request_id that will be included in all logs
    let span = tracing::span!(
        tracing::Level::INFO,
        "request",
        request_id = %request_id,
    );
    let _guard = span.enter();
    
    // Continue with the request (all logs within will include request_id from the span)
    let mut response = next.run(request).await;

    // Add request ID to response headers
    if let Ok(header_value) = HeaderValue::from_str(&request_id) {
        response.headers_mut().insert("X-Request-ID", header_value);
    }

    response
}

/// Extract request ID from request extensions
#[allow(dead_code)]
pub fn get_request_id(request: &Request) -> Option<String> {
    request.extensions().get::<String>().cloned()
}

