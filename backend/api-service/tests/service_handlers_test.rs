/**
 * Service Handler Tests
 * Comprehensive test suite for service status functionality
 */

use api_service::AppState;
use api_service::presentation::api::handlers::service_handlers::get_service_status;
use axum::{
    body::Body,
    http::{Method, StatusCode, Request as HttpRequest},
    response::Response,
    Router,
};
use sqlx::PgPool;
use std::sync::Arc;
use tower::ServiceExt;

// Import shared test helpers
mod test_helpers;
use test_helpers::{setup_test_database, create_test_app_state, get_response_json};

// Helper to create service status request
fn create_service_status_request() -> HttpRequest<Body> {
    HttpRequest::builder()
        .method(Method::GET)
        .uri("/api/services/status")
        .body(Body::empty())
        .unwrap()
}

fn create_test_router(app_state: Arc<AppState>) -> Router {
    axum::Router::new()
        .route("/api/services/status", axum::routing::get(get_service_status))
        .layer(axum::middleware::from_fn_with_state(
            app_state.clone(),
            api_service::presentation::api::middleware::session_middleware::session_middleware,
        ))
        .layer(axum::middleware::from_fn(
            api_service::presentation::api::middleware::request_id::request_id_middleware,
        ))
        .with_state(app_state)
}

// ========== Service Handler Tests ==========
// Tests are organized: Success Cases → Service-Specific → Edge Cases → Response Structure

// ========== Success Cases ==========

#[tokio::test]
#[ignore] // Ignore until DATABASE_URL is set for tests
async fn test_get_service_status_success() {
    let pool = setup_test_database().await;
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    // Set environment variables to enable services (defaults)
    std::env::set_var("ENABLE_POSTGRES", "true");
    std::env::set_var("ENABLE_OPENBAO_SERVICE", "true");
    std::env::set_var("ENABLE_LOCALSTACK", "true");
    std::env::set_var("ENABLE_NATS", "false");
    std::env::set_var("ENABLE_KAFKA", "false");
    
    let request = create_service_status_request();
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    
    // Verify response structure
    assert!(json.get("services").is_some());
    assert!(json.get("overall_status").is_some());
    assert!(json.get("checked_at").is_some());
    
    let services = json.get("services").unwrap().as_array().unwrap();
    assert!(!services.is_empty());
    
    // Verify PostgreSQL is included
    let postgres_service = services.iter()
        .find(|s| s.get("name").unwrap().as_str().unwrap() == "PostgreSQL");
    assert!(postgres_service.is_some());
}

#[tokio::test]
#[ignore]
async fn test_get_service_status_with_mixed_services() {
    let pool = setup_test_database().await;
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    // Enable some services, disable others
    std::env::set_var("ENABLE_POSTGRES", "true");
    std::env::set_var("ENABLE_OPENBAO_SERVICE", "false");
    std::env::set_var("ENABLE_LOCALSTACK", "false");
    std::env::set_var("ENABLE_NATS", "true");
    std::env::set_var("ENABLE_KAFKA", "false");
    
    let request = create_service_status_request();
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    
    let services = json.get("services").unwrap().as_array().unwrap();
    
    // Check that enabled services are present
    let postgres = services.iter()
        .find(|s| s.get("name").unwrap().as_str().unwrap() == "PostgreSQL");
    assert!(postgres.is_some());
    assert_eq!(postgres.unwrap().get("enabled").unwrap().as_bool().unwrap(), true);
    
    // Check that disabled services are marked as disabled
    let openbao = services.iter()
        .find(|s| s.get("name").unwrap().as_str().unwrap() == "OpenBao");
    assert!(openbao.is_some());
    assert_eq!(openbao.unwrap().get("enabled").unwrap().as_bool().unwrap(), false);
    
    // Overall status should reflect mixed state
    let overall_status = json.get("overall_status").unwrap().as_str().unwrap();
    assert!(matches!(overall_status, "operational" | "degraded" | "down"));
}

#[tokio::test]
#[ignore]
async fn test_get_service_status_all_disabled() {
    let pool = setup_test_database().await;
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    // Disable all services
    std::env::set_var("ENABLE_POSTGRES", "false");
    std::env::set_var("ENABLE_OPENBAO_SERVICE", "false");
    std::env::set_var("ENABLE_LOCALSTACK", "false");
    std::env::set_var("ENABLE_NATS", "false");
    std::env::set_var("ENABLE_KAFKA", "false");
    
    let request = create_service_status_request();
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    
    // Overall status should be "unknown" when no services are enabled
    let overall_status = json.get("overall_status").unwrap().as_str().unwrap();
    assert_eq!(overall_status, "unknown");
    
    let services = json.get("services").unwrap().as_array().unwrap();
    // All services should be marked as disabled
    for service in services {
        assert_eq!(service.get("enabled").unwrap().as_bool().unwrap(), false);
    }
}

// ========== Service-Specific Tests ==========

#[tokio::test]
#[ignore]
async fn test_postgres_health_check() {
    let pool = setup_test_database().await;
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    // Enable only PostgreSQL
    std::env::set_var("ENABLE_POSTGRES", "true");
    std::env::set_var("ENABLE_OPENBAO_SERVICE", "false");
    std::env::set_var("ENABLE_LOCALSTACK", "false");
    std::env::set_var("ENABLE_NATS", "false");
    std::env::set_var("ENABLE_KAFKA", "false");
    
    let request = create_service_status_request();
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    
    let services = json.get("services").unwrap().as_array().unwrap();
    let postgres = services.iter()
        .find(|s| s.get("name").unwrap().as_str().unwrap() == "PostgreSQL")
        .unwrap();
    
    assert_eq!(postgres.get("enabled").unwrap().as_bool().unwrap(), true);
    // PostgreSQL should be operational if database connection works
    // (operational status depends on actual database health)
    assert!(postgres.get("operational").is_some());
    assert!(postgres.get("last_checked").is_some());
}

// ========== Response Structure Tests ==========

#[tokio::test]
#[ignore]
async fn test_service_status_response_structure() {
    let pool = setup_test_database().await;
    let app_state = create_test_app_state(pool).await;
    let app = create_test_router(app_state);
    
    let request = create_service_status_request();
    let response = app.oneshot(request).await.unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    let json = get_response_json(response).await;
    
    // Verify top-level structure
    assert!(json.get("services").is_some());
    assert!(json.get("overall_status").is_some());
    assert!(json.get("checked_at").is_some());
    
    // Verify services array structure
    let services = json.get("services").unwrap().as_array().unwrap();
    for service in services {
        assert!(service.get("name").is_some());
        assert!(service.get("enabled").is_some());
        assert!(service.get("operational").is_some());
        assert!(service.get("last_checked").is_some());
        
        // health_endpoint and error are optional
        // Verify name is a string
        assert!(service.get("name").unwrap().is_string());
        // Verify enabled and operational are booleans
        assert!(service.get("enabled").unwrap().is_boolean());
        assert!(service.get("operational").unwrap().is_boolean());
    }
    
    // Verify overall_status is one of the expected values
    let overall_status = json.get("overall_status").unwrap().as_str().unwrap();
    assert!(matches!(overall_status, "operational" | "degraded" | "down" | "unknown"));
    
    // Verify checked_at is a valid ISO 8601 timestamp
    let checked_at = json.get("checked_at").unwrap().as_str().unwrap();
    assert!(checked_at.contains('T') || checked_at.contains(' ')); // Basic timestamp check
}

