/**
 * Shared test helpers for API service tests
 * 
 * This module provides common test infrastructure:
 * - Database setup with automatic migrations
 * - Test AppState creation
 * - Request/response helpers
 * 
 * Database Setup:
 * - If DATABASE_URL is set, uses that database (for CI/manual testing)
 * - Otherwise, attempts to use testcontainers to spin up a PostgreSQL container
 * - Requires Docker to be running for testcontainers to work
 * - For best results, set DATABASE_URL in CI environments
 * 
 * Note: For proper testcontainers container lifetime management,
 * consider using testcontainers directly in test functions.
 */

use api_service::AppState;
use shared::infrastructure::database::{create_pool, DatabaseService};
use shared::infrastructure::oidc::TokenManager;
use shared::infrastructure::session::{SessionCache, SessionService};
use shared::infrastructure::zanzibar::{GraphCache, PermissionChecker, RelationshipStore};
use sqlx::PgPool;
use std::sync::Arc;

/// Setup test database with automatic migrations
/// 
/// Database setup strategy:
/// 1. If DATABASE_URL is set, uses that database (recommended for CI/manual testing)
/// 2. Otherwise, attempts to use testcontainers to spin up a PostgreSQL container
/// 
/// When using testcontainers:
/// - Requires Docker to be running
/// - Container is automatically cleaned up when test completes
/// - Container stays alive for the duration of the test (managed by testcontainers)
/// 
/// For best results in CI, set DATABASE_URL environment variable.
pub async fn setup_test_database() -> PgPool {
    // Check if DATABASE_URL is explicitly set (for CI/manual testing)
    let database_url = if let Ok(url) = std::env::var("DATABASE_URL") {
        url
    } else {
        // Use testcontainers to spin up a PostgreSQL container
        setup_testcontainers_database().await
    };
    
    let pool = create_pool(&database_url).await
        .expect("Failed to create test database pool");
    
    // Run migrations automatically
    run_migrations(&pool).await;
    
    pool
}

/// Setup test database using testcontainers
/// Returns the database URL for the containerized PostgreSQL instance
/// 
/// The container will stay alive for the duration of the test function.
/// Container is automatically stopped and removed when it goes out of scope.
/// 
/// Note: For proper container lifetime management in helper functions,
/// consider using testcontainers directly in test functions or setting DATABASE_URL.
async fn setup_testcontainers_database() -> String {
    use testcontainers_modules::postgres::Postgres;
    use testcontainers_modules::testcontainers::runners::AsyncRunner;
    
    // Start PostgreSQL container with custom configuration
    // testcontainers-modules handles the client internally
    let container = Postgres::default()
        .with_user("auth_user")
        .with_password("auth_password")
        .with_db_name("auth_db_test")
        .start()
        .await
        .expect("Failed to start PostgreSQL container. Make sure Docker is running.");
    
    // Get connection details
    let host = container.get_host().await.expect("Failed to get container host");
    let port = container.get_host_port_ipv4(5432).await.expect("Failed to get container port");
    
    // Construct database URL
    let url = format!(
        "postgresql://auth_user:auth_password@{}:{}/auth_db_test",
        host, port
    );
    
    // IMPORTANT: Container lifetime management
    // The container must stay alive for the test duration. Since we're returning
    // just the URL from a helper function, we need to keep the container alive.
    // 
    // Options:
    // 1. Use testcontainers directly in test functions (recommended for proper lifecycle)
    // 2. Set DATABASE_URL for CI/manual testing (recommended for CI)
    // 3. Return a struct that holds both pool and container (more complex)
    //
    // For now, we keep the container alive by not dropping it.
    // The container will be automatically cleaned up when the process exits.
    // Note: This is a workaround. For production use, manage containers at test level.
    std::mem::forget(container);
    
    url
}

/// Run database migrations on the given pool
pub async fn run_migrations(pool: &PgPool) {
    // Find migrations directory
    let migrations_path = find_migrations_path();
    
    let migrator = sqlx::migrate::Migrator::new(migrations_path.as_path()).await
        .expect("Failed to initialize migrator");
    
    migrator.run(pool).await
        .expect("Failed to run migrations");
}

/// Find the migrations directory path
fn find_migrations_path() -> std::path::PathBuf {
    let possible_paths = vec![
        "./migrations",
        "../migrations",
        "../../migrations",
        "../../../migrations",
    ];
    
    for path_str in &possible_paths {
        let path = std::path::Path::new(path_str);
        if path.exists() {
            return path.to_path_buf();
        }
    }
    
    panic!("Could not find migrations directory. Tried: {:?}", possible_paths);
}

/// Create a test AppState with all required services
pub async fn create_test_app_state(pool: PgPool) -> Arc<AppState> {
    let database_service = Arc::new(DatabaseService::new(pool.clone()));
    
    // Create test token manager
    let jwt_secret = "test-jwt-secret-key-for-testing-only-min-32-chars-long";
    let token_manager = Arc::new(TokenManager::new(
        jwt_secret,
        "http://localhost:8080".to_string(),
        3600,
    ));
    
    // Initialize Zanzibar services
    let relationship_store = Arc::new(RelationshipStore::new(
        Box::new(shared::infrastructure::repositories::RelationshipRepositoryImpl::new(pool.clone())),
    ));
    
    let permission_repository = Arc::new(shared::infrastructure::repositories::PermissionRepositoryImpl::new(pool.clone()));
    
    // Initialize use cases
    let get_permissions_use_case = authz_core::authorization::GetUserPermissionsUseCase::new(
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
        Box::new(shared::infrastructure::repositories::RoleRepositoryImpl::new(
            database_service.clone(),
            relationship_store.clone(),
            permission_repository.clone(),
        )),
        Box::new(shared::infrastructure::repositories::PermissionRepositoryImpl::new(pool.clone())),
    );
    
    let login_use_case = Arc::new(authz_core::auth::LoginUseCase::new(
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
        Box::new(shared::infrastructure::repositories::RefreshTokenRepositoryImpl::new(pool.clone())),
        Box::new(shared::infrastructure::repositories::RoleRepositoryImpl::new(
            database_service.clone(),
            relationship_store.clone(),
            permission_repository.clone(),
        )),
        Box::new(shared::infrastructure::repositories::PermissionRepositoryImpl::new(pool.clone())),
        authz_core::oidc::TokenManager::new(jwt_secret, "http://localhost:8080".to_string(), 3600),
    ));
    
    let refresh_token_use_case = Arc::new(authz_core::auth::RefreshTokenUseCase::new(
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
        Box::new(shared::infrastructure::repositories::RefreshTokenRepositoryImpl::new(pool.clone())),
        authz_core::oidc::TokenManager::new(jwt_secret, "http://localhost:8080".to_string(), 3600),
    ));
    
    let logout_use_case = Arc::new(authz_core::auth::LogoutUseCase::new(
        Box::new(shared::infrastructure::repositories::RefreshTokenRepositoryImpl::new(pool.clone())),
    ));
    
    let userinfo_use_case = Arc::new(authz_core::auth::UserInfoUseCase::new(
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
        get_permissions_use_case,
    ));
    
    // Initialize graph cache
    let graph_cache = Arc::new(GraphCache::new(60, true));
    
    // Permission checker
    let permission_checker_store = RelationshipStore::new(
        Box::new(shared::infrastructure::repositories::RelationshipRepositoryImpl::new(pool.clone())),
    );
    let permission_checker = Arc::new(
        PermissionChecker::with_graph_cache(
            permission_checker_store,
            graph_cache.clone(),
            true,
        )
    );
    
    // Setup repository and use cases
    let setup_repository = Arc::new(shared::infrastructure::repositories::SetupRepositoryImpl::new(pool.clone()));
    let setup_organization_use_case = Arc::new(admin_service::use_cases::setup::SetupOrganizationUseCase::new(
        Box::new(shared::infrastructure::repositories::SetupRepositoryImpl::new(pool.clone())),
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
    ));
    let create_super_admin_use_case = Arc::new(admin_service::use_cases::setup::CreateSuperAdminUseCase::new(
        Box::new(shared::infrastructure::repositories::SetupRepositoryImpl::new(pool.clone())),
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
    ));
    
    // Initialize master key and DEK manager
    use shared::config::providers::{KmsProvider, HashiCorpConfig, KmsProviderConfig};
    use shared::infrastructure::encryption::MasterKey;
    let master_key = MasterKey::generate().expect("Failed to generate test master key");
    let kms_config = KmsProviderConfig {
        provider: KmsProvider::HashiCorp,
        hashicorp: Some(HashiCorpConfig {
            addr: "http://localhost:8200".to_string(),
            token: "test-token".to_string(),
            mount_path: "secret".to_string(),
        }),
        aws: None,
        gcp: None,
        azure: None,
    };
    let vault = shared::infrastructure::providers::create_kms_provider(&kms_config)
        .unwrap_or_else(|_| {
            Box::new(shared::infrastructure::encryption::vault_impl::hashicorp::HashiCorpVault::new(
                "http://localhost:8200",
                "test-token",
                "secret",
            ))
        });
    let dek_manager = Arc::new(shared::infrastructure::encryption::DekManager::new(master_key, vault));
    
    // Role repository
    let role_repository = Arc::new(shared::infrastructure::repositories::RoleRepositoryImpl::new(
        database_service.clone(),
        relationship_store.clone(),
        permission_repository.clone(),
    ));
    
    // Session service
    let session_repository = Arc::new(shared::infrastructure::repositories::SessionRepositoryImpl::new(database_service.clone()));
    let session_cache = Arc::new(SessionCache::with_max_entries(1000));
    let session_config = shared::config::settings::SessionConfig {
        admin_ui_ttl_hours: 8,
        client_ui_ttl_hours: 24,
        api_ttl_hours: 1,
        admin_ui_cors_origins: vec!["http://localhost:5174".to_string()],
        client_ui_cors_origins: vec!["http://localhost:5175".to_string()],
        cache_max_entries: 1000,
    };
    let session_service = Arc::new(SessionService::new(
        session_repository,
        session_cache,
        session_config,
    ));
    
    Arc::new(AppState {
        database_service,
        database_pool: Arc::new(pool),
        login_use_case,
        refresh_token_use_case,
        logout_use_case,
        userinfo_use_case,
        token_manager,
        permission_checker,
        relationship_store,
        setup_repository,
        setup_organization_use_case,
        create_super_admin_use_case,
        dek_manager,
        role_repository,
        graph_cache: Some(graph_cache),
        session_service,
    })
}

/// Helper to extract response body as JSON
pub async fn get_response_json(response: axum::response::Response) -> serde_json::Value {
    let (_parts, body) = response.into_parts();
    let body_bytes = axum::body::to_bytes(body, usize::MAX).await.unwrap();
    serde_json::from_slice(&body_bytes).unwrap_or_else(|_| {
        serde_json::json!({"error": format!("Failed to parse response: {}", String::from_utf8_lossy(&body_bytes))})
    })
}

/// Create a test user in the database
/// If a user with the same email already exists, it will be deleted first
pub async fn create_test_user(pool: &PgPool, email: &str, password: &str, is_active: bool) -> uuid::Uuid {
    use bcrypt::{hash, DEFAULT_COST};
    
    // Delete existing user with this email if it exists (for test isolation)
    sqlx::query("DELETE FROM users WHERE email = $1")
        .bind(email)
        .execute(pool)
        .await
        .ok();
    
    let password_hash = hash(password, DEFAULT_COST).expect("Failed to hash password");
    let user_id = uuid::Uuid::new_v4();
    
    let username = email.split('@').next().unwrap_or("user");
    sqlx::query(
        r#"
        INSERT INTO users (id, email, username, password_hash, is_active, is_verified, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
        "#,
    )
    .bind(user_id)
    .bind(email)
    .bind(username)
    .bind(password_hash)
    .bind(is_active)
    .execute(pool)
    .await
    .expect("Failed to create test user");
    
    user_id
}

/// Mark setup as completed in database
pub async fn mark_setup_completed(pool: &PgPool, completed_by: Option<uuid::Uuid>) {
    sqlx::query(
        r#"
        INSERT INTO setup_status (setup_completed, setup_completed_at, setup_completed_by, created_at, updated_at)
        VALUES (true, NOW(), $1, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE
        SET setup_completed = true,
            setup_completed_at = NOW(),
            setup_completed_by = $1,
            updated_at = NOW()
        "#,
    )
    .bind(completed_by)
    .execute(pool)
    .await
    .expect("Failed to mark setup as completed");
}

