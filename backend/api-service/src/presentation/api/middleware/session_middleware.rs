use axum::{
    extract::{Request, State},
    http::{HeaderMap, HeaderValue},
    middleware::Next,
    response::Response,
};
use shared::domain::entities::Session;
use shared::infrastructure::session::SessionService;
use std::net::IpAddr;
use std::sync::Arc;
use super::super::AppState;
use uuid::Uuid;

const SESSION_TOKEN_HEADER: &str = "X-Session-Token";
const SESSION_TOKEN_COOKIE_HEADER: &str = "Cookie";

/// Extract IP address from request, handling proxy headers
fn extract_ip_address(headers: &HeaderMap) -> Option<IpAddr> {
    // Try X-Forwarded-For first (first IP if multiple)
    if let Some(forwarded_for) = headers.get("X-Forwarded-For") {
        if let Ok(forwarded_str) = forwarded_for.to_str() {
            // X-Forwarded-For can contain multiple IPs: "client, proxy1, proxy2"
            let first_ip = forwarded_str.split(',').next()?.trim();
            if let Ok(ip) = first_ip.parse::<IpAddr>() {
                return Some(ip);
            }
        }
    }

    // Try X-Real-IP
    if let Some(real_ip) = headers.get("X-Real-IP") {
        if let Ok(real_ip_str) = real_ip.to_str() {
            if let Ok(ip) = real_ip_str.parse::<IpAddr>() {
                return Some(ip);
            }
        }
    }

    // Try CF-Connecting-IP (Cloudflare)
    if let Some(cf_ip) = headers.get("CF-Connecting-IP") {
        if let Ok(cf_ip_str) = cf_ip.to_str() {
            if let Ok(ip) = cf_ip_str.parse::<IpAddr>() {
                return Some(ip);
            }
        }
    }

    None
}

/// Generate a new session token
fn generate_session_token() -> String {
    format!("sess_{}", Uuid::new_v4())
}

/// Extract session token from Cookie header
fn extract_session_token_from_cookies(headers: &HeaderMap) -> Option<String> {
    let cookie_header = headers.get(SESSION_TOKEN_COOKIE_HEADER)?;
    let cookie_str = cookie_header.to_str().ok()?;
    
    // Parse cookies: "name1=value1; name2=value2"
    for cookie in cookie_str.split(';') {
        let parts: Vec<&str> = cookie.split('=').collect();
        if parts.len() == 2 {
            let name = parts[0].trim();
            let value = parts[1].trim();
            if name == "session_token" {
                return Some(value.to_string());
            }
        }
    }
    None
}

/// Session middleware that creates/retrieves sessions and extracts IP addresses
/// This runs before authentication, so it handles ghost sessions
pub async fn session_middleware(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    mut request: Request,
    next: Next,
) -> Response {
    // Extract or generate session token
    let session_token = headers
        .get(SESSION_TOKEN_HEADER)
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string())
        .or_else(|| extract_session_token_from_cookies(&headers))
        .unwrap_or_else(|| generate_session_token());

    // Extract IP address
    let ip_address = extract_ip_address(&headers)
        .or_else(|| {
            // Fallback: try to get from request extensions (set by server)
            request
                .extensions()
                .get::<axum::extract::ConnectInfo<std::net::SocketAddr>>()
                .map(|addr| addr.ip())
        })
        .unwrap_or_else(|| {
            // Final fallback: use localhost
            tracing::warn!("Could not extract IP address, using localhost");
            "127.0.0.1".parse().unwrap()
        });

    // Extract user agent
    let user_agent = headers
        .get("User-Agent")
        .and_then(|h| h.to_str().ok())
        .map(|s| s.to_string());

    // Get or create session
    let session = match state
        .session_service
        .create_or_get_session(&session_token, ip_address, user_agent.as_deref())
        .await
    {
        Ok(session) => session,
        Err(e) => {
            tracing::error!("Failed to create/get session: {}", e);
            // Continue without session - request will still be processed
            return next.run(request).await;
        }
    };

    // Update session activity (non-blocking, fire and forget)
    let session_id = session.id;
    let session_service = state.session_service.clone();
    tokio::spawn(async move {
        if let Err(e) = session_service.update_activity(session_id).await {
            tracing::warn!("Failed to update session activity: {}", e);
        }
    });

    // Store session in request extensions
    request.extensions_mut().insert(session.clone());
    request.extensions_mut().insert(session.id);

    // Add session token to response if it's new
    let mut response = next.run(request).await;

    // Set session cookie if it's a new session (check if cookie was in request)
    if extract_session_token_from_cookies(&headers).is_none() {
        // Note: In production, set HttpOnly, Secure, SameSite attributes
        let cookie = format!(
            "session_token={}; Path=/; Max-Age={}; SameSite=Lax",
            session_token, 3600 * 24 * 7 // 7 days
        );
        if let Ok(header_value) = HeaderValue::from_str(&cookie) {
            response.headers_mut().insert("Set-Cookie", header_value);
        }
    }

    response
}

/// Extract session from request extensions
pub fn get_session(request: &Request) -> Option<Session> {
    request.extensions().get::<Session>().cloned()
}

/// Extract session ID from request extensions
pub fn get_session_id(request: &Request) -> Option<Uuid> {
    request.extensions().get::<Uuid>().copied()
}

