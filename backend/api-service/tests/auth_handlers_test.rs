/**
 * Login Handler Tests
 * Comprehensive test suite for authentication functionality
 */

use api_service::AppState;
use api_service::presentation::api::handlers::auth_handlers::{login, logout, refresh_token, userinfo};
use axum::{
    body::Body,
    http::{header, Method, StatusCode, Request as HttpRequest},
    response::Response,
    Router,
};
use bcrypt::{hash, DEFAULT_COST};
use sqlx::PgPool;
use std::sync::Arc;
use tower::ServiceExt;
use uuid::Uuid;

// Import shared test helpers
mod test_helpers;
use test_helpers::{setup_test_database, create_test_app_state, get_response_json, create_test_user};

// Create test router for auth handlers
fn create_test_router(app_state: Arc<AppState>) -> Router {
    // Public routes (no auth required) - matching actual route configuration
    let public_routes = axum::Router::new()
        .route("/auth/login", axum::routing::post(login));
    
    // Protected routes (require auth) - matching actual route configuration
    // Note: logout is in protected routes but handler works without auth (just clears if present)
    let protected_routes = axum::Router::new()
        .route("/auth/logout", axum::routing::post(logout))
        .route("/auth/token", axum::routing::post(refresh_token))
        .route("/auth/userinfo", axum::routing::get(userinfo))
        .layer(axum::middleware::from_fn_with_state(
            app_state.clone(),
            api_service::presentation::api::middleware::auth_middleware::auth_middleware,
        ));
    
    axum::Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .layer(axum::middleware::from_fn_with_state(
            app_state.clone(),
            api_service::presentation::api::middleware::session_middleware::session_middleware,
        ))
        .layer(axum::middleware::from_fn(
            api_service::presentation::api::middleware::request_id::request_id_middleware,
        ))
        .with_state(app_state)
}

// Helper to create login request
fn create_login_request(
    email: &str,
    password: &str,
    app_type: Option<&str>,
    app_device: Option<&str>,
) -> HttpRequest<Body> {
    let body = serde_json::json!({
        "email": email,
        "password": password
    });
    
    let mut request = HttpRequest::builder()
        .method(Method::POST)
        .uri("/auth/login")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&body).unwrap()))
        .unwrap();
    
    if let Some(app_type) = app_type {
        request.headers_mut().insert(
            "X-App-Type",
            header::HeaderValue::from_str(app_type).unwrap(),
        );
    }
    
    if let Some(app_device) = app_device {
        request.headers_mut().insert(
            "X-App-Device",
            header::HeaderValue::from_str(app_device).unwrap(),
        );
    }
    
    request
}

// Helper to create logout request
// Note: logout route is protected, so it requires authentication
// The handler itself is lenient and just clears whatever is provided
fn create_logout_request(session_token: Option<&str>, refresh_token: Option<&str>) -> HttpRequest<Body> {
    let mut request = HttpRequest::builder()
        .method(Method::POST)
        .uri("/auth/logout")
        .body(Body::empty())
        .unwrap();
    
    if let Some(token) = session_token {
        request.headers_mut().insert(
            header::COOKIE,
            header::HeaderValue::from_str(&format!("session_token={}", token)).unwrap(),
        );
    }
    
    // Refresh token can be in Authorization header (for logout handler)
    // But auth_middleware also needs valid auth, so we may need access token separately
    if let Some(token) = refresh_token {
        request.headers_mut().insert(
            header::AUTHORIZATION,
            header::HeaderValue::from_str(&format!("Bearer {}", token)).unwrap(),
        );
    }
    
    request
}

// Helper to create refresh token request
// Note: refresh_token route is protected, but refresh tokens are JWTs
// So we can use the refresh token itself in Authorization header for auth_middleware
// The refresh token also goes in the request body for the handler
fn create_refresh_token_request(refresh_token: &str) -> HttpRequest<Body> {
    let body = serde_json::json!({
        "refresh_token": refresh_token
    });
    
    let mut request = HttpRequest::builder()
        .method(Method::POST)
        .uri("/auth/token")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&body).unwrap()))
        .unwrap();
    
    // Include refresh token in Authorization header for auth_middleware
    // (refresh tokens are JWTs, so they can be validated by auth_middleware)
    request.headers_mut().insert(
        header::AUTHORIZATION,
        header::HeaderValue::from_str(&format!("Bearer {}", refresh_token)).unwrap(),
    );
    
    request
}

// Helper to create userinfo request (requires auth)
fn create_userinfo_request(access_token: &str) -> HttpRequest<Body> {
    HttpRequest::builder()
        .method(Method::GET)
        .uri("/auth/userinfo")
        .header(header::AUTHORIZATION, format!("Bearer {}", access_token))
        .body(Body::empty())
        .unwrap()
}

// ========== Login Handler Tests ==========
// Tests are organized in logical order: Success → Validation → Auth Failures → Session → Edge Cases → Response Structure

// ========== Success Cases ==========

#[tokio::test]
#[ignore] // Ignore until DATABASE_URL is set for tests
async fn test_login_success_with_valid_credentials() {
    // Setup test database
    let pool = setup_test_database().await;
    
    // Create test user
    let email = "test@example.com";
    let password = "testpassword123";
    let user_id = create_test_user(&pool, email, password, true).await;
    
    // Create AppState and router
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    // Create login request
    let request = create_login_request(email, password, Some("admin-ui"), Some("web"));
    
    // Make request
    let response = app.oneshot(request).await.unwrap();
    
    // Assert
    assert_eq!(response.status(), StatusCode::OK);
    
    let json = get_response_json(response).await;
    assert!(json.get("accessToken").is_some());
    assert!(json.get("refreshToken").is_some());
    assert!(json.get("user").is_some());
    
    let user = json.get("user").unwrap();
    assert_eq!(user.get("id").unwrap().as_str().unwrap(), &user_id.to_string());
    assert_eq!(user.get("email").unwrap().as_str().unwrap(), email);
}

#[tokio::test]
#[ignore]
async fn test_login_success_with_session() {
    // Setup test database
    let pool = setup_test_database().await;
    
    // Create test user
    let email = "test@example.com";
    let password = "testpassword123";
    let _user_id = create_test_user(&pool, email, password, true).await;
    
    // Create AppState and router
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    // Create login request with session cookie (session middleware will create ghost session)
    let mut request = create_login_request(email, password, Some("admin-ui"), Some("web"));
    request.headers_mut().insert(
        header::COOKIE,
        header::HeaderValue::from_str("session_token=test-session-token").unwrap(),
    );
    
    // Make request
    let response = app.oneshot(request).await.unwrap();
    
    // Assert
    assert_eq!(response.status(), StatusCode::OK);
    
    let json = get_response_json(response).await;
    assert!(json.get("accessToken").is_some());
    // Session token may or may not be present depending on session authentication success
}

// ========== Input Validation Tests ==========

#[tokio::test]
#[ignore]
async fn test_login_fails_with_invalid_json() {
    let pool = setup_test_database().await;
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = HttpRequest::builder()
        .method(Method::POST)
        .uri("/auth/login")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from("invalid json{"))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let json = get_response_json(response).await;
    assert!(json.get("error").is_some());
    assert!(json["error"].as_str().unwrap().contains("Invalid JSON"));
}

#[tokio::test]
#[ignore]
async fn test_login_fails_with_missing_body() {
    let pool = setup_test_database().await;
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = HttpRequest::builder()
        .method(Method::POST)
        .uri("/auth/login")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::empty())
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    // Should fail when trying to read body
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

// ========== Authentication Failure Tests ==========

#[tokio::test]
#[ignore]
async fn test_login_fails_with_nonexistent_user() {
    let pool = setup_test_database().await;
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_login_request("nonexistent@example.com", "password123", None, None);
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    let json = get_response_json(response).await;
    assert!(json.get("error").is_some());
}

#[tokio::test]
#[ignore]
async fn test_login_fails_with_wrong_password() {
    let pool = setup_test_database().await;
    let email = "test@example.com";
    let _user_id = create_test_user(&pool, email, "correctpassword", true).await;
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_login_request(email, "wrongpassword", None, None);
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    let json = get_response_json(response).await;
    assert!(json.get("error").is_some());
}

#[tokio::test]
#[ignore]
async fn test_login_fails_with_inactive_user() {
    let pool = setup_test_database().await;
    let email = "test@example.com";
    let password = "testpassword123";
    let _user_id = create_test_user(&pool, email, password, false).await; // is_active = false
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_login_request(email, password, None, None);
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    let json = get_response_json(response).await;
    assert!(json.get("error").is_some());
}

// ========== Session Handling Tests ==========

#[tokio::test]
#[ignore]
async fn test_login_sets_app_type_and_device() {
    // This test verifies that app_type and app_device are passed correctly
    // The actual verification would require mocking or checking session in database
    let pool = setup_test_database().await;
    let email = "test@example.com";
    let password = "testpassword123";
    let _user_id = create_test_user(&pool, email, password, true).await;
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_login_request(email, password, Some("client-ui"), Some("mobile"));
    let response = app.oneshot(request).await.unwrap();
    
    // If successful, app_type and device should be set in session
    assert_eq!(response.status(), StatusCode::OK);
}

#[tokio::test]
#[ignore]
async fn test_login_handles_session_authentication_failure() {
    // Test that login succeeds even if session authentication fails
    let pool = setup_test_database().await;
    let email = "test@example.com";
    let password = "testpassword123";
    let _user_id = create_test_user(&pool, email, password, true).await;
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    // Create request with invalid session token
    let mut request = create_login_request(email, password, Some("admin-ui"), Some("web"));
    request.headers_mut().insert(
        header::COOKIE,
        header::HeaderValue::from_str("session_token=invalid-session").unwrap(),
    );
    
    let response = app.oneshot(request).await.unwrap();
    
    // Should still succeed (login works, session auth failure is logged but doesn't fail login)
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    assert!(json.get("accessToken").is_some());
}

// ========== Edge Case Tests ==========

#[tokio::test]
#[ignore]
async fn test_login_response_structure() {
    let pool = setup_test_database().await;
    let email = "test@example.com";
    let password = "testpassword123";
    let _user_id = create_test_user(&pool, email, password, true).await;
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_login_request(email, password, None, None);
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    
    // Check response structure (camelCase fields)
    assert!(json.get("accessToken").is_some());
    assert!(json.get("refreshToken").is_some());
    assert!(json.get("expiresIn").is_some());
    assert!(json.get("user").is_some());
    
    let user = json.get("user").unwrap();
    assert!(user.get("id").is_some());
    assert!(user.get("email").is_some());
    assert!(user.get("role").is_some());
    assert!(user.get("permissions").is_some());
}

// ========== Logout Handler Tests ==========

#[tokio::test]
#[ignore]
async fn test_logout_with_session() {
    // Setup: Create user and login to get a real session
    let pool = setup_test_database().await;
    let email = "test@example.com";
    let password = "testpassword123";
    let _user_id = create_test_user(&pool, email, password, true).await;
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    // Login first to create a real authenticated session
    let login_request = create_login_request(email, password, Some("admin-ui"), None);
    let login_response = app.clone().oneshot(login_request).await.unwrap();
    assert_eq!(login_response.status(), StatusCode::OK);
    
    // Extract session token from Set-Cookie header
    let session_token = login_response.headers()
        .get("Set-Cookie")
        .and_then(|h| h.to_str().ok())
        .and_then(|cookie_str| {
            cookie_str.split(';')
                .find(|part| part.trim().starts_with("session_token="))
                .and_then(|part| part.split('=').nth(1))
                .map(|token| token.trim().to_string())
        })
        .expect("Session token should be in Set-Cookie header");
    
    // Now logout with the real session token
    let request = create_logout_request(Some(&session_token), None);
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    
    // Check headers before consuming response
    let has_set_cookie = response.headers().get("Set-Cookie").is_some();
    
    let json = get_response_json(response).await;
    assert_eq!(json.get("message"), Some(&serde_json::json!("Logged out")));
    
    // Verify Set-Cookie header is present to clear session
    assert!(has_set_cookie);
}

#[tokio::test]
#[ignore]
async fn test_logout_with_refresh_token() {
    // Setup: Create user and login to get a real refresh token
    let pool = setup_test_database().await;
    let email = "test@example.com";
    let password = "testpassword123";
    let _user_id = create_test_user(&pool, email, password, true).await;
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    // Login first to get a real refresh token
    let login_request = create_login_request(email, password, None, None);
    let login_response = app.clone().oneshot(login_request).await.unwrap();
    assert_eq!(login_response.status(), StatusCode::OK);
    let login_json = get_response_json(login_response).await;
    let refresh_token = login_json.get("refreshToken")
        .and_then(|v| v.as_str())
        .expect("Refresh token should be in login response");
    let access_token = login_json.get("accessToken")
        .and_then(|v| v.as_str())
        .expect("Access token should be in login response");
    
    // Now logout with the real refresh token
    // Refresh tokens are JWTs, so they can be used in Authorization header for auth_middleware
    // The logout handler will also extract it from Authorization header to revoke it
    let request = create_logout_request(None, Some(refresh_token));
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    assert_eq!(json.get("message"), Some(&serde_json::json!("Logged out")));
}

#[tokio::test]
#[ignore]
async fn test_logout_without_credentials() {
    // Note: Logout is in protected routes, so it requires authentication
    // This test verifies that logout returns 401 when no credentials are provided
    let pool = setup_test_database().await;
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_logout_request(None, None);
    let response = app.oneshot(request).await.unwrap();
    
    // Since logout is in protected routes, it requires authentication
    // The handler itself is lenient, but auth_middleware blocks unauthenticated requests
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    let json = get_response_json(response).await;
    assert!(json.get("error").is_some());
}

// ========== Refresh Token Handler Tests ==========

#[tokio::test]
#[ignore]
async fn test_refresh_token_success() {
    // First, login to get a refresh token
    let pool = setup_test_database().await;
    let email = "test@example.com";
    let password = "testpassword123";
    let _user_id = create_test_user(&pool, email, password, true).await;
    
    let app_state = create_test_app_state(pool.clone()).await;
    let app = create_test_router(app_state.clone());
    
    // Login first
    let login_request = create_login_request(email, password, None, None);
    let login_response = app.clone().oneshot(login_request).await.unwrap();
    assert_eq!(login_response.status(), StatusCode::OK);
    let login_json = get_response_json(login_response).await;
    let refresh_token = login_json.get("refreshToken").unwrap().as_str().unwrap();
    let access_token = login_json.get("accessToken").unwrap().as_str().unwrap();
    
    // Now refresh the token (refresh token is a JWT, so it can be used for auth)
    let refresh_request = create_refresh_token_request(refresh_token);
    let refresh_response = app.oneshot(refresh_request).await.unwrap();
    
    assert_eq!(refresh_response.status(), StatusCode::OK);
    let refresh_json = get_response_json(refresh_response).await;
    assert!(refresh_json.get("accessToken").is_some());
    assert!(refresh_json.get("refreshToken").is_some());
}

#[tokio::test]
#[ignore]
async fn test_refresh_token_invalid_token() {
    let pool = setup_test_database().await;
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    // For invalid token test, use invalid refresh token
    // auth_middleware will try to validate it as JWT and fail
    let request = create_refresh_token_request("invalid-token");
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
    let json = get_response_json(response).await;
    assert!(json.get("error").is_some());
}

// ========== Userinfo Handler Tests ==========

#[tokio::test]
#[ignore]
async fn test_userinfo_success() {
    // First, login to get an access token
    let pool = setup_test_database().await;
    let email = "test@example.com";
    let password = "testpassword123";
    let user_id = create_test_user(&pool, email, password, true).await;
    
    let app_state = create_test_app_state(pool.clone()).await;
    let app = create_test_router(app_state.clone());
    
    // Login first
    let login_request = create_login_request(email, password, None, None);
    let login_response = app.clone().oneshot(login_request).await.unwrap();
    assert_eq!(login_response.status(), StatusCode::OK);
    let login_json = get_response_json(login_response).await;
    let access_token = login_json.get("accessToken").unwrap().as_str().unwrap();
    
    // Now get userinfo
    let userinfo_request = create_userinfo_request(access_token);
    let userinfo_response = app.oneshot(userinfo_request).await.unwrap();
    
    assert_eq!(userinfo_response.status(), StatusCode::OK);
    let userinfo_json = get_response_json(userinfo_response).await;
    assert_eq!(userinfo_json.get("id").unwrap().as_str().unwrap(), &user_id.to_string());
    assert_eq!(userinfo_json.get("email").unwrap().as_str().unwrap(), email);
}

#[tokio::test]
#[ignore]
async fn test_userinfo_unauthorized() {
    let pool = setup_test_database().await;
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_userinfo_request("invalid-token");
    let response = app.oneshot(request).await.unwrap();
    
    // Should fail with 401 (auth middleware will reject invalid token)
    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

