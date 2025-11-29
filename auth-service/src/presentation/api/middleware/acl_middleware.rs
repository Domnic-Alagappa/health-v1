use axum::{
    extract::Request,
    middleware::Next,
    response::Response,
    http::StatusCode,
};

pub async fn acl_middleware(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // TODO: Implement ACL checking using Zanzibar
    // Check if user has permission to access the resource
    let response = next.run(request).await;
    Ok(response)
}

