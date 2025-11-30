// Integration tests for migration system
// These tests require a running PostgreSQL database
// Set DATABASE_URL environment variable to run these tests

use shared::infrastructure::database::{create_pool, migrations::run_migrations};
use std::path::Path;

#[tokio::test]
#[ignore] // Ignore by default - requires database
async fn test_migrations_run_successfully() {
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set for integration tests");
    
    let pool = create_pool(&database_url).await
        .expect("Failed to create database pool");
    
    let migrations_dir = Path::new("../../../../migrations");
    
    // Run migrations
    let result = run_migrations(&pool, migrations_dir).await;
    assert!(result.is_ok(), "Migrations should run successfully");
}

#[tokio::test]
#[ignore]
async fn test_migration_tracking() {
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set for integration tests");
    
    let pool = create_pool(&database_url).await
        .expect("Failed to create database pool");
    
    let migrations_dir = Path::new("../../../../migrations");
    
    // Run migrations twice - second run should skip already executed migrations
    let result1 = run_migrations(&pool, migrations_dir).await;
    assert!(result1.is_ok());
    
    let result2 = run_migrations(&pool, migrations_dir).await;
    assert!(result2.is_ok(), "Second run should succeed (migrations already executed)");
    
    // Verify migrations are tracked
    let count: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM schema_migrations"
    )
    .fetch_one(&pool)
    .await
    .expect("Failed to query schema_migrations");
    
    assert!(count.0 > 0, "Should have recorded migrations");
}

