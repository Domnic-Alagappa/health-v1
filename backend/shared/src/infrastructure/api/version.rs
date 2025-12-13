//! API versioning middleware and utilities
//! Supports URL-based versioning (/v1/, /v2/) and header-based version negotiation

use axum::{
    extract::Request,
    http::{HeaderMap, HeaderValue, StatusCode},
    middleware::Next,
    response::{Response, IntoResponse},
};
use std::str::FromStr;

/// API version extracted from request
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ApiVersion {
    V1,
    V2,
    Unversioned,
}

impl ApiVersion {
    /// Extract version from URL path
    pub fn from_path(path: &str) -> Self {
        if path.starts_with("/v2/") {
            ApiVersion::V2
        } else if path.starts_with("/v1/") {
            ApiVersion::V1
        } else {
            ApiVersion::Unversioned
        }
    }

    /// Extract version from Accept header
    /// Supports: `Accept: application/vnd.api+json;version=1`
    pub fn from_accept_header(headers: &HeaderMap) -> Option<Self> {
        if let Some(accept) = headers.get("Accept") {
            if let Ok(accept_str) = accept.to_str() {
                // Parse version from Accept header
                if accept_str.contains("version=2") {
                    return Some(ApiVersion::V2);
                } else if accept_str.contains("version=1") {
                    return Some(ApiVersion::V1);
                }
            }
        }
        None
    }

    /// Get version string for response headers
    pub fn to_header_value(&self) -> &'static str {
        match self {
            ApiVersion::V1 => "1",
            ApiVersion::V2 => "2",
            ApiVersion::Unversioned => "1", // Default to v1 for unversioned
        }
    }
}

/// Middleware to add API version information to response headers
/// Adds `X-API-Version` header to all responses
pub async fn version_middleware(
    request: Request,
    next: Next,
) -> Response {
    let version = ApiVersion::from_path(request.uri().path());
    
    // If no version in URL, check Accept header
    let version = if version == ApiVersion::Unversioned {
        ApiVersion::from_accept_header(request.headers())
            .unwrap_or(ApiVersion::V1)
    } else {
        version
    };

    let mut response = next.run(request).await;
    
    // Add version header to response
    if let Ok(header_value) = HeaderValue::from_str(version.to_header_value()) {
        response.headers_mut().insert("X-API-Version", header_value);
    }

    // Add deprecation warning for unversioned routes
    if version == ApiVersion::Unversioned {
        if let Ok(warning) = HeaderValue::from_str(
            r#"299 - "Deprecated: This endpoint will be removed in a future version. Please use /v1/ prefix."#
        ) {
            response.headers_mut().insert("Warning", warning);
        }
    }

    response
}

/// Get current API version from request
pub fn get_api_version(request: &Request) -> ApiVersion {
    let version = ApiVersion::from_path(request.uri().path());
    if version == ApiVersion::Unversioned {
        ApiVersion::from_accept_header(request.headers())
            .unwrap_or(ApiVersion::V1)
    } else {
        version
    }
}
