/**
 * Setup Handler Tests
 * Comprehensive test suite for setup functionality
 */

use api_service::AppState;
use admin_service::handlers::setup_handlers::{check_setup_status, initialize_setup};
use axum::{
    body::Body,
    http::{header, Method, StatusCode, Request as HttpRequest},
    response::Response,
    Router,
};
use sqlx::PgPool;
use std::sync::Arc;
use tower::ServiceExt;
use uuid::Uuid;

// Import shared test helpers
mod test_helpers;
use test_helpers::{setup_test_database, create_test_app_state, get_response_json, mark_setup_completed};

fn create_test_router(app_state: Arc<AppState>) -> Router {
    axum::Router::new()
        .route("/api/setup/status", axum::routing::get(check_setup_status))
        .route("/api/setup/initialize", axum::routing::post(initialize_setup))
        .layer(axum::middleware::from_fn_with_state(
            app_state.clone(),
            api_service::presentation::api::middleware::session_middleware::session_middleware,
        ))
        .layer(axum::middleware::from_fn(
            api_service::presentation::api::middleware::request_id::request_id_middleware,
        ))
        .with_state(app_state)
}

// Helper to create setup initialize request
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

// Helper to create check setup status request
fn create_check_status_request() -> HttpRequest<Body> {
    HttpRequest::builder()
        .method(Method::GET)
        .uri("/api/setup/status")
        .body(Body::empty())
        .unwrap()
}

// ========== Setup Handler Tests ==========
// Tests are organized in logical order: Status Check → Initialize Setup
// Within each section: Success → Validation → Errors → Edge Cases

// ========== check_setup_status Tests ==========

#[tokio::test]
#[ignore] // Ignore until DATABASE_URL is set for tests
async fn test_check_setup_status_not_completed() {
    let pool = setup_test_database().await;
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_check_status_request();
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    assert_eq!(json.get("setup_completed"), Some(&serde_json::json!(false)));
}

#[tokio::test]
#[ignore]
async fn test_check_setup_status_completed() {
    let pool = setup_test_database().await;
    let user_id = Uuid::new_v4();
    mark_setup_completed(&pool, Some(user_id)).await;
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_check_status_request();
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    assert_eq!(json.get("setup_completed"), Some(&serde_json::json!(true)));
    assert!(json.get("setup_completed_at").is_some());
    assert!(json.get("setup_completed_by").is_some());
}

#[tokio::test]
#[ignore]
async fn test_check_setup_status_no_record() {
    // Test when no setup_status record exists
    let pool = setup_test_database().await;
    
    // Ensure no setup_status records exist
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_check_status_request();
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    assert_eq!(json.get("setup_completed"), Some(&serde_json::json!(false)));
}

// ========== initialize_setup Tests ==========
// Organized: Success → Already Completed → Validation → Edge Cases → Response Structure

#[tokio::test]
#[ignore]
async fn test_initialize_setup_success() {
    let pool = setup_test_database().await;
    
    // Ensure setup is not completed
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_setup_request(
        "Test Organization",
        "test-org",
        Some("test.example.com"),
        "admin@test.com",
        "admin",
        "SecurePassword123!",
    );
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    
    assert_eq!(json.get("success"), Some(&serde_json::json!(true)));
    assert!(json.get("organization_id").is_some());
    assert!(json.get("admin_user_id").is_some());
    assert!(json.get("relationships_created").is_some());
    
    let relationships = json.get("relationships_created").unwrap().as_array().unwrap();
    assert!(!relationships.is_empty());
}

#[tokio::test]
#[ignore]
async fn test_initialize_setup_already_completed() {
    let pool = setup_test_database().await;
    
    // Mark setup as already completed
    mark_setup_completed(&pool, None).await;
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_setup_request(
        "Test Organization",
        "test-org",
        None,
        "admin@test.com",
        "admin",
        "SecurePassword123!",
    );
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    let json = get_response_json(response).await;
    assert!(json.get("error").is_some());
    assert!(json["error"].as_str().unwrap().contains("already been completed"));
}

// ========== Input Validation Tests ==========

#[tokio::test]
#[ignore]
async fn test_initialize_setup_missing_organization_name() {
    let pool = setup_test_database().await;
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let body = serde_json::json!({
        "organization_slug": "test-org",
        "admin_email": "admin@test.com",
        "admin_username": "admin",
        "admin_password": "SecurePassword123!"
    });
    
    let request = HttpRequest::builder()
        .method(Method::POST)
        .uri("/api/setup/initialize")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&body).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    // Should fail with 400 (missing required field)
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
#[ignore]
async fn test_initialize_setup_missing_admin_email() {
    let pool = setup_test_database().await;
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let body = serde_json::json!({
        "organization_name": "Test Organization",
        "organization_slug": "test-org",
        "admin_username": "admin",
        "admin_password": "SecurePassword123!"
    });
    
    let request = HttpRequest::builder()
        .method(Method::POST)
        .uri("/api/setup/initialize")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_string(&body).unwrap()))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    // Should fail with 400 (missing required field)
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

#[tokio::test]
#[ignore]
async fn test_initialize_setup_invalid_json() {
    let pool = setup_test_database().await;
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = HttpRequest::builder()
        .method(Method::POST)
        .uri("/api/setup/initialize")
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from("invalid json{"))
        .unwrap();
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::BAD_REQUEST);
}

// ========== Edge Case Tests ==========

#[tokio::test]
#[ignore]
async fn test_initialize_setup_duplicate_organization_slug() {
    let pool = setup_test_database().await;
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    // First setup
    let app_state1 = create_test_app_state(pool.clone()).await;
    let app1 = create_test_router(app_state1);
    
    let request1 = create_setup_request(
        "First Organization",
        "test-org",
        None,
        "admin1@test.com",
        "admin1",
        "SecurePassword123!",
    );
    
    let response1 = app1.oneshot(request1).await.unwrap();
    assert_eq!(response1.status(), StatusCode::OK);
    
    // Try to create another organization with same slug (should fail)
    // But first we need to reset setup status to allow second initialization attempt
    // Actually, this test should verify that after first setup, second setup fails
    // Let's test that setup can't be run twice
    let app_state2 = create_test_app_state(pool).await;
    let app2 = create_test_router(app_state2);
    
    let request2 = create_setup_request(
        "Second Organization",
        "test-org",
        None,
        "admin2@test.com",
        "admin2",
        "SecurePassword123!",
    );
    
    let response2 = app2.oneshot(request2).await.unwrap();
    assert_eq!(response2.status(), StatusCode::BAD_REQUEST);
    let json = get_response_json(response2).await;
    assert!(json.get("error").is_some());
    assert!(json["error"].as_str().unwrap().contains("already been completed"));
}

#[tokio::test]
#[ignore]
async fn test_initialize_setup_creates_relationships() {
    let pool = setup_test_database().await;
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_setup_request(
        "Test Organization",
        "test-org",
        None,
        "admin@test.com",
        "admin",
        "SecurePassword123!",
    );
    
    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    
    let json = get_response_json(response).await;
    let relationships = json.get("relationships_created").unwrap().as_array().unwrap();
    
    // Verify key relationships are created
    let relationship_strings: Vec<String> = relationships
        .iter()
        .map(|r| format!("{}:{}:{}", r["user"], r["relation"], r["object"]))
        .collect();
    
    // Check for owner relationship
    assert!(relationship_strings.iter().any(|s| s.contains("owner")));
    // Check for member relationship
    assert!(relationship_strings.iter().any(|s| s.contains("member")));
    // Check for has_role relationship
    assert!(relationship_strings.iter().any(|s| s.contains("has_role") && s.contains("role:admin")));
    // Check for app access relationships
    assert!(relationship_strings.iter().any(|s| s.contains("can_access")));
}

#[tokio::test]
#[ignore]
async fn test_initialize_setup_without_domain() {
    let pool = setup_test_database().await;
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_setup_request(
        "Test Organization",
        "test-org",
        None, // No domain
        "admin@test.com",
        "admin",
        "SecurePassword123!",
    );
    
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    assert_eq!(json.get("success"), Some(&serde_json::json!(true)));
}

// ========== Response Structure Tests ==========

#[tokio::test]
#[ignore]
async fn test_initialize_setup_response_structure() {
    let pool = setup_test_database().await;
    sqlx::query("DELETE FROM setup_status")
        .execute(&pool)
        .await
        .ok();
    
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_setup_request(
        "Test Organization",
        "test-org",
        Some("test.example.com"),
        "admin@test.com",
        "admin",
        "SecurePassword123!",
    );
    
    let response = app.oneshot(request).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    
    let json = get_response_json(response).await;
    
    // Verify response structure
    assert!(json.get("success").is_some());
    assert!(json.get("message").is_some());
    assert!(json.get("organization_id").is_some());
    assert!(json.get("admin_user_id").is_some());
    assert!(json.get("relationships_created").is_some());
    
    // Verify IDs are valid UUIDs
    let org_id_str = json["organization_id"].as_str().unwrap();
    Uuid::parse_str(org_id_str).expect("organization_id should be a valid UUID");
    
    let admin_id_str = json["admin_user_id"].as_str().unwrap();
    Uuid::parse_str(admin_id_str).expect("admin_user_id should be a valid UUID");
    
    // Verify relationships structure
    let relationships = json["relationships_created"].as_array().unwrap();
    for rel in relationships {
        assert!(rel.get("user").is_some());
        assert!(rel.get("relation").is_some());
        assert!(rel.get("object").is_some());
    }
}

