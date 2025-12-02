use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use shared::domain::entities::RequestLog;
use shared::domain::repositories::RequestLogRepository;
use shared::infrastructure::repositories::RequestLogRepositoryImpl;
use std::sync::Arc;
use std::time::Instant;
use uuid::Uuid;
use super::super::AppState;
use super::session_middleware::get_session;

/// Request logging middleware that logs all HTTP requests
/// Captures IP, request_id, session_id, timing, and sizes
pub async fn request_logging_middleware(
    State(state): State<Arc<AppState>>,
    request: Request,
    next: Next,
) -> Response {
    let start_time = Instant::now();
    let method = request.method().clone();
    let uri = request.uri().clone();
    let path = uri.path().to_string();
    let query_string = uri.query().map(|s| s.to_string());

    // Extract session and request ID
    let session = get_session(&request);
    let session_id = session.as_ref().map(|s| s.id).unwrap_or_else(|| {
        // If no session, create a temporary ID for logging
        // This shouldn't happen if session_middleware runs first
        tracing::warn!("No session found in request extensions");
        Uuid::nil()
    });

    let request_id = request
        .extensions()
        .get::<String>()
        .cloned()
        .unwrap_or_else(|| "unknown".to_string());

    // Extract IP and user agent from session or request
    let ip_address = session
        .as_ref()
        .map(|s| s.ip_address)
        .or_else(|| {
            // Try to extract from headers as fallback
            extract_ip_from_headers(request.headers())
        })
        .unwrap_or_else(|| {
            "127.0.0.1".parse().unwrap()
        });

    let user_agent = session
        .as_ref()
        .and_then(|s| s.user_agent.clone())
        .or_else(|| {
            request
                .headers()
                .get("User-Agent")
                .and_then(|h| h.to_str().ok())
                .map(|s| s.to_string())
        });

    // Get user_id from session if authenticated
    let user_id = session.as_ref().and_then(|s| s.user_id);

    // Estimate request size (approximate)
    let request_size_bytes = estimate_request_size(&request);

    // Process request
    let response = next.run(request).await;

    // Calculate response time
    let response_time_ms = start_time.elapsed().as_millis() as u64;

    // Get status code
    let status_code = response.status().as_u16();

    // Estimate response size (approximate)
    let response_size_bytes = estimate_response_size(&response);

    // Create request log (async, non-blocking)
    let log = RequestLog::new(session_id, request_id.clone(), method.to_string(), path.clone(), ip_address, status_code)
        .with_user_id_opt(user_id)
        .with_query_string_opt(query_string)
        .with_user_agent_opt(user_agent)
        .with_response_time(response_time_ms)
        .with_request_size(request_size_bytes.unwrap_or(0))
        .with_response_size(response_size_bytes.unwrap_or(0));

    // Log asynchronously (don't block response)
    let repository = RequestLogRepositoryImpl::new(state.database_service.clone());
    tokio::spawn(async move {
        if let Err(e) = repository.create(log).await {
            tracing::warn!("Failed to log request: {}", e);
        }
    });

    // Log to tracing as well
    tracing::info!(
        method = %method,
        path = %path,
        status = status_code,
        response_time_ms = response_time_ms,
        session_id = %session_id,
        request_id = %request_id,
        "Request completed"
    );

    response
}

/// Extract IP from headers (fallback if session not available)
fn extract_ip_from_headers(headers: &axum::http::HeaderMap) -> Option<std::net::IpAddr> {
    // Try X-Forwarded-For first
    if let Some(forwarded_for) = headers.get("X-Forwarded-For") {
        if let Ok(forwarded_str) = forwarded_for.to_str() {
            let first_ip = forwarded_str.split(',').next()?.trim();
            if let Ok(ip) = first_ip.parse::<std::net::IpAddr>() {
                return Some(ip);
            }
        }
    }

    // Try X-Real-IP
    if let Some(real_ip) = headers.get("X-Real-IP") {
        if let Ok(real_ip_str) = real_ip.to_str() {
            if let Ok(ip) = real_ip_str.parse::<std::net::IpAddr>() {
                return Some(ip);
            }
        }
    }

    None
}

/// Estimate request size (approximate)
fn estimate_request_size(request: &Request) -> Option<u64> {
    // Basic estimation: method + path + headers
    // In a real implementation, you might want to read the body
    let method_size = request.method().as_str().len() as u64;
    let path_size = request.uri().to_string().len() as u64;
    let headers_size: u64 = request
        .headers()
        .iter()
        .map(|(name, value)| name.as_str().len() + value.len())
        .sum::<usize>() as u64;

    Some(method_size + path_size + headers_size)
}

/// Estimate response size (approximate)
fn estimate_response_size(response: &Response) -> Option<u64> {
    // Basic estimation: status + headers
    // In a real implementation, you might want to read the body
    let status_size = response.status().as_str().len() as u64;
    let headers_size: u64 = response
        .headers()
        .iter()
        .map(|(name, value)| name.as_str().len() + value.len())
        .sum::<usize>() as u64;

    Some(status_size + headers_size)
}

