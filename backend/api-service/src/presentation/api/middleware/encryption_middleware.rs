use axum::{
    extract::Request,
    middleware::Next,
    response::Response,
};

#[allow(dead_code)]
pub async fn encryption_middleware(
    request: Request,
    next: Next,
) -> Response {
    // TODO: Implement automatic field encryption/decryption
    // Encrypt sensitive fields on write
    // Decrypt sensitive fields on read
    next.run(request).await
}

