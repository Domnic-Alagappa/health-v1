/**
 * End-to-End Flow Tests
 * Comprehensive tests for the complete user journey: setup → login
 */

use api_service::AppState;
use admin_service::handlers::setup_handlers::{check_setup_status, initialize_setup};
use api_service::presentation::api::handlers::auth_handlers::login;
use axum::{
    body::Body,
    http::{header, Method, StatusCode, Request as HttpRequest},
    Router,
};
use sqlx::PgPool;
use std::sync::Arc;
use tower::ServiceExt;

// Import shared test helpers
mod test_helpers;
use test_helpers::{setup_test_database, create_test_app_state, get_response_json};

// Helper to create router with all routes for E2E testing
fn create_e2e_router(app_state: Arc<AppState>) -> Router {
    axum::Router::new()
        .route("/api/setup/status", axum::routing::get(check_setup_status))
        .route("/api/setup/initialize", axum::routing::post(initialize_setup))
        .route("/auth/login", axum::routing::post(login))
        .layer(axum::middleware::from_fn_with_state(
            app_state.clone(),
            api_service::presentation::api::middleware::session_middleware::session_middleware,
        ))
        .layer(axum::middleware::from_fn(
            api_service::presentation::api::middleware::request_id::request_id_middleware,
        ))
        .with_state(app_state)
}

// Helper to create setup request
fn create_setup_request(
    organization_name: &str,
    organization_slug: &str,
    organization_domain: Option<&str>,
    admin_email: &str,
    admin_username: &str,
    admin_password: &str,
) -> HttpRequest<Body> {
    let mut body = serde_json::json!({
        "organization_name": organization_name,
        "organization_slug": organization_slug,
        "admin_email": admin_email,
        "admin_username": admin_username,
        "admin_password": admin_password
    });
    
    if let Some(domain) = organization_domain {
        body["organization_domain"] = serde_json::Value::String(domain.to_string());
    }
    
    HttpRequest::builder()
        .method(Method::POST)
        .uri("/api/setup/initialize")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&body).unwrap()))
        .unwrap()
}

// Helper to create login request
fn create_login_request(email: &str, password: &str) -> HttpRequest<Body> {
    let body = serde_json::json!({
        "email": email,
        "password": password
    });
    
    HttpRequest::builder()
        .method(Method::POST)
        .uri("/auth/login")
        .header(header::CONTENT_TYPE, "application/json")
        .header("X-App-Type", "admin-ui")
        .header("X-App-Device", "web")
        .body(Body::from(serde_json::to_string(&body).unwrap()))
        .unwrap()
}

// Helper to create check setup status request
fn create_check_status_request() -> HttpRequest<Body> {
    HttpRequest::builder()
        .method(Method::GET)
        .uri("/api/setup/status")
        .body(Body::empty())
        .unwrap()
}

// ========== End-to-End Flow Tests ==========
// Tests the complete user journey from setup to login

#[tokio::test]
async fn test_e2e_setup_then_login() {
    // Complete flow: setup → create admin → login
    let pool = setup_test_database().await;
    
    // Ensure setup is not completed
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool).await;
    let app = create_e2e_router(app_state);
    
    // Step 1: Check setup status (should be false)
    let status_request = create_check_status_request();
    let status_response = app.clone().oneshot(status_request).await.unwrap();
    assert_eq!(status_response.status(), StatusCode::OK);
    let status_json = get_response_json(status_response).await;
    assert_eq!(status_json.get("setup_completed"), Some(&serde_json::json!(false)));
    
    // Step 2: Initialize setup
    let org_name = "Test Organization";
    let org_slug = "test-org";
    let admin_email = "admin@test.com";
    let admin_username = "admin";
    let admin_password = "SecurePassword123!";
    
    let setup_request = create_setup_request(
        org_name,
        org_slug,
        Some("test.example.com"),
        admin_email,
        admin_username,
        admin_password,
    );
    
    let setup_response = app.clone().oneshot(setup_request).await.unwrap();
    assert_eq!(setup_response.status(), StatusCode::OK);
    let setup_json = get_response_json(setup_response).await;
    
    assert_eq!(setup_json.get("success"), Some(&serde_json::json!(true)));
    let organization_id = setup_json.get("organization_id").unwrap().as_str().unwrap();
    let admin_user_id = setup_json.get("admin_user_id").unwrap().as_str().unwrap();
    
    // Step 3: Verify setup status (should be true)
    let status_request2 = create_check_status_request();
    let status_response2 = app.clone().oneshot(status_request2).await.unwrap();
    assert_eq!(status_response2.status(), StatusCode::OK);
    let status_json2 = get_response_json(status_response2).await;
    assert_eq!(status_json2.get("setup_completed"), Some(&serde_json::json!(true)));
    
    // Step 4: Login with created admin credentials
    let login_request = create_login_request(admin_email, admin_password);
    let login_response = app.oneshot(login_request).await.unwrap();
    
    assert_eq!(login_response.status(), StatusCode::OK);
    let login_json = get_response_json(login_response).await;
    
    // Step 5: Verify login response includes tokens and user info
    assert!(login_json.get("accessToken").is_some());
    assert!(login_json.get("refreshToken").is_some());
    assert!(login_json.get("user").is_some());
    
    let user = login_json.get("user").unwrap();
    assert_eq!(user.get("id").unwrap().as_str().unwrap(), admin_user_id);
    assert_eq!(user.get("email").unwrap().as_str().unwrap(), admin_email);
    
    // Verify user has admin role
    assert!(user.get("role").is_some());
    let role = user.get("role").unwrap().as_str().unwrap();
    assert!(role.contains("admin") || role == "admin");
}

#[tokio::test]
async fn test_e2e_setup_status_before_setup() {
    let pool = setup_test_database().await;
    
    // Ensure setup is not completed
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool).await;
    let app = create_e2e_router(app_state);
    
    let request = create_check_status_request();
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    assert_eq!(json.get("setup_completed"), Some(&serde_json::json!(false)));
}

#[tokio::test]
async fn test_e2e_setup_status_after_setup() {
    let pool = setup_test_database().await;
    
    // Ensure setup is not completed
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool.clone()).await;
    let app = create_e2e_router(app_state);
    
    // Perform setup
    let setup_request = create_setup_request(
        "Test Organization",
        "test-org",
        None,
        "admin@test.com",
        "admin",
        "SecurePassword123!",
    );
    
    let setup_response = app.clone().oneshot(setup_request).await.unwrap();
    assert_eq!(setup_response.status(), StatusCode::OK);
    
    // Check status after setup
    let status_request = create_check_status_request();
    let status_response = app.oneshot(status_request).await.unwrap();
    
    assert_eq!(status_response.status(), StatusCode::OK);
    let json = get_response_json(status_response).await;
    assert_eq!(json.get("setup_completed"), Some(&serde_json::json!(true)));
    assert!(json.get("setup_completed_at").is_some());
}

#[tokio::test]
async fn test_e2e_login_after_setup() {
    let pool = setup_test_database().await;
    
    // Ensure setup is not completed
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool).await;
    let app = create_e2e_router(app_state);
    
    // Step 1: Setup
    let admin_email = "admin@test.com";
    let admin_password = "SecurePassword123!";
    
    let setup_request = create_setup_request(
        "Test Organization",
        "test-org",
        None,
        admin_email,
        "admin",
        admin_password,
    );
    
    let setup_response = app.clone().oneshot(setup_request).await.unwrap();
    assert_eq!(setup_response.status(), StatusCode::OK);
    
    // Step 2: Login immediately after setup
    let login_request = create_login_request(admin_email, admin_password);
    let login_response = app.oneshot(login_request).await.unwrap();
    
    assert_eq!(login_response.status(), StatusCode::OK);
    let login_json = get_response_json(login_response).await;
    
    // Verify login was successful
    assert!(login_json.get("accessToken").is_some());
    assert!(login_json.get("user").is_some());
    
    let user = login_json.get("user").unwrap();
    assert_eq!(user.get("email").unwrap().as_str().unwrap(), admin_email);
}

#[tokio::test]
async fn test_e2e_setup_prevents_duplicate() {
    let pool = setup_test_database().await;
    
    // Ensure setup is not completed
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool.clone()).await;
    let app = create_e2e_router(app_state);
    
    // First setup
    let setup_request1 = create_setup_request(
        "First Organization",
        "test-org",
        None,
        "admin1@test.com",
        "admin1",
        "SecurePassword123!",
    );
    
    let response1 = app.clone().oneshot(setup_request1).await.unwrap();
    assert_eq!(response1.status(), StatusCode::OK);
    
    // Try to setup again (should fail)
    let setup_request2 = create_setup_request(
        "Second Organization",
        "test-org-2",
        None,
        "admin2@test.com",
        "admin2",
        "SecurePassword123!",
    );
    
    let response2 = app.oneshot(setup_request2).await.unwrap();
    assert_eq!(response2.status(), StatusCode::BAD_REQUEST);
    let json = get_response_json(response2).await;
    assert!(json.get("error").is_some());
    assert!(json["error"].as_str().unwrap().contains("already been completed"));
}

#[tokio::test]
async fn test_e2e_login_with_setup_admin() {
    let pool = setup_test_database().await;
    
    // Ensure setup is not completed
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool).await;
    let app = create_e2e_router(app_state);
    
    // Setup with specific admin credentials
    let admin_email = "setup-admin@test.com";
    let admin_password = "AdminPassword123!";
    let admin_username = "setupadmin";
    
    let setup_request = create_setup_request(
        "Test Organization",
        "test-org",
        Some("test.example.com"),
        admin_email,
        admin_username,
        admin_password,
    );
    
    let setup_response = app.clone().oneshot(setup_request).await.unwrap();
    assert_eq!(setup_response.status(), StatusCode::OK);
    let setup_json = get_response_json(setup_response).await;
    
    let admin_user_id = setup_json.get("admin_user_id").unwrap().as_str().unwrap();
    
    // Login with the admin created during setup
    let login_request = create_login_request(admin_email, admin_password);
    let login_response = app.oneshot(login_request).await.unwrap();
    
    assert_eq!(login_response.status(), StatusCode::OK);
    let login_json = get_response_json(login_response).await;
    
    // Verify the logged-in user is the admin created during setup
    let user = login_json.get("user").unwrap();
    assert_eq!(user.get("id").unwrap().as_str().unwrap(), admin_user_id);
    assert_eq!(user.get("email").unwrap().as_str().unwrap(), admin_email);
    
    // Verify admin has proper permissions
    assert!(user.get("permissions").is_some());
    let permissions = user.get("permissions").unwrap().as_array().unwrap();
    // Admin should have permissions
    assert!(!permissions.is_empty() || user.get("role").unwrap().as_str().unwrap().contains("admin"));
}

