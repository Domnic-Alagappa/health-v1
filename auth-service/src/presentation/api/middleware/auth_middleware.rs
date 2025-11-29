use axum::{
    extract::Request,
    middleware::Next,
    response::Response,
    http::StatusCode,
};
use crate::infrastructure::oidc::TokenManager;

pub async fn auth_middleware(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // Extract token from Authorization header
    let auth_header = request.headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok())
        .ok_or(StatusCode::UNAUTHORIZED)?;

    if !auth_header.starts_with("Bearer ") {
        return Err(StatusCode::UNAUTHORIZED);
    }

    let token = &auth_header[7..];

    // TODO: Validate token using TokenManager
    // For now, just pass through
    let response = next.run(request).await;
    Ok(response)
}

