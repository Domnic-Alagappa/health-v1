use axum::{
    extract::Request,
    middleware::Next,
    response::Response,
    http::HeaderValue,
};
use uuid::Uuid;

/// Middleware that generates a unique request ID for each request
/// Adds X-Request-ID header to both request and response
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

    // Continue with the request
    let mut response = next.run(request).await;

    // Add request ID to response headers
    if let Ok(header_value) = HeaderValue::from_str(&request_id) {
        response.headers_mut().insert("X-Request-ID", header_value);
    }

    response
}

/// Extract request ID from request extensions
pub fn get_request_id(request: &Request) -> Option<String> {
    request.extensions().get::<String>().cloned()
}

