mod presentation;

use shared::AppResult;
use shared::AppError;
use shared::RequestContext;
use shared::config::Settings;
use shared::infrastructure::database::{create_pool, DatabaseService};
use shared::infrastructure::database::migrations;
use shared::infrastructure::repositories;
use shared::infrastructure::zanzibar;
use authz_core::*;
use admin_service::*;

use std::net::SocketAddr;
use std::sync::Arc;
use tracing::info;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load environment variables
    dotenv::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::fmt::init();

    // Load configuration
    let settings = shared::config::Settings::from_env()
        .map_err(|e| format!("Failed to load configuration: {}", e))?;

    info!("Starting api-service on {}:{}", settings.server.host, settings.server.port);

    // Initialize database connection using database service
    info!("Connecting to database...");
    let pool = shared::infrastructure::database::create_pool(&settings.database.url).await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;
    
    // Create shared DatabaseService instance for all repositories
    let database_service = Arc::new(shared::infrastructure::database::DatabaseService::new(pool.clone()));
    
    // Verify database health
    database_service.health_check().await
        .map_err(|e| format!("Database health check failed: {}", e))?;
    info!("Database health check passed");
    
    // Run migrations using sqlx's built-in migrator
    info!("Running database migrations...");
    let migrations_path = std::path::Path::new("./migrations");
    let migrator = sqlx::migrate::Migrator::new(migrations_path)
        .await
        .map_err(|e| format!("Failed to initialize migrator: {}", e))?;
    migrator
        .run(&pool)
        .await
        .map_err(|e| format!("Failed to run migrations: {}", e))?;
    
    info!("Database migrations completed");

    // Initialize repositories (we'll create instances as needed for use cases)
    // Note: Each use case gets its own repository instance sharing the same pool

    // Initialize token manager (create multiple instances for different use cases)
    let token_manager_for_state = shared::infrastructure::oidc::TokenManager::new(
        &settings.oidc.jwt_secret,
        settings.oidc.issuer.clone(),
        settings.oidc.jwt_expiration,
    );
    let token_manager_arc = Arc::new(token_manager_for_state);
    
    let token_manager_clone = authz_core::oidc::TokenManager::new(
        &settings.oidc.jwt_secret,
        settings.oidc.issuer.clone(),
        settings.oidc.jwt_expiration,
    );
    
    let token_manager_clone2 = authz_core::oidc::TokenManager::new(
        &settings.oidc.jwt_secret,
        settings.oidc.issuer.clone(),
        settings.oidc.jwt_expiration,
    );

    // Initialize use cases using DatabaseService
    let get_permissions_use_case = authz_core::authorization::GetUserPermissionsUseCase::new(
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
        Box::new(shared::infrastructure::repositories::RoleRepositoryImpl::new(database_service.clone())),
        Box::new(shared::infrastructure::repositories::PermissionRepositoryImpl::new(pool.clone())),
    );

    let login_use_case = Arc::new(authz_core::auth::LoginUseCase::new(
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
        Box::new(shared::infrastructure::repositories::RefreshTokenRepositoryImpl::new(pool.clone())),
        Box::new(shared::infrastructure::repositories::RoleRepositoryImpl::new(database_service.clone())),
        Box::new(shared::infrastructure::repositories::PermissionRepositoryImpl::new(pool.clone())),
        token_manager_clone,
    ));

    let refresh_token_use_case = Arc::new(authz_core::auth::RefreshTokenUseCase::new(
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
        Box::new(shared::infrastructure::repositories::RefreshTokenRepositoryImpl::new(pool.clone())),
        token_manager_clone2,
    ));

    let logout_use_case = Arc::new(authz_core::auth::LogoutUseCase::new(
        Box::new(shared::infrastructure::repositories::RefreshTokenRepositoryImpl::new(pool.clone())),
    ));

    let userinfo_use_case = Arc::new(authz_core::auth::UserInfoUseCase::new(
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
        get_permissions_use_case,
    ));

    // Initialize Zanzibar services
    let relationship_store = Arc::new(shared::infrastructure::zanzibar::RelationshipStore::new(
        Box::new(shared::infrastructure::repositories::RelationshipRepositoryImpl::new(pool.clone())),
    ));
    
    let permission_checker = Arc::new(shared::infrastructure::zanzibar::PermissionChecker::new(
        shared::infrastructure::zanzibar::RelationshipStore::new(
            Box::new(shared::infrastructure::repositories::RelationshipRepositoryImpl::new(pool.clone())),
        ),
    ));

    // Initialize setup components
    let setup_repository = Arc::new(shared::infrastructure::repositories::SetupRepositoryImpl::new(pool.clone()));
    let user_repository_for_setup = Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone()));
    
    let setup_organization_use_case = Arc::new(admin_service::use_cases::setup::SetupOrganizationUseCase::new(
        Box::new(shared::infrastructure::repositories::SetupRepositoryImpl::new(pool.clone())),
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
    ));
    
    let create_super_admin_use_case = Arc::new(admin_service::use_cases::setup::CreateSuperAdminUseCase::new(
        Box::new(shared::infrastructure::repositories::SetupRepositoryImpl::new(pool.clone())),
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
    ));

    // Create application state
    use api_service::AppState;
    let app_state = AppState {
        database_service: database_service.clone(),
        database_pool: Arc::new(pool.clone()),
        login_use_case,
        refresh_token_use_case,
        logout_use_case,
        userinfo_use_case,
        token_manager: token_manager_arc,
        permission_checker,
        relationship_store,
        setup_repository,
        setup_organization_use_case,
        create_super_admin_use_case,
    };

    // Build application router with state, middleware, and CORS
    let app_state_arc = Arc::new(app_state);
    
    // Create public routes (no auth required)
    let public_routes = axum::Router::new()
        .route("/health", axum::routing::get(|| async { "OK" }))
        .route("/auth/login", axum::routing::post(crate::presentation::api::handlers::login))
        .route("/api/setup/status", axum::routing::get(admin_service::handlers::check_setup_status))
        .route("/api/setup/initialize", axum::routing::post(admin_service::handlers::initialize_setup))
        .route("/api/services/status", axum::routing::get(crate::presentation::api::handlers::get_service_status))
        .with_state(app_state_arc.clone());
    
    // Create protected routes with middleware
    let protected_routes = axum::Router::new()
        .route("/auth/logout", axum::routing::post(crate::presentation::api::handlers::logout))
        .route("/auth/token", axum::routing::post(crate::presentation::api::handlers::refresh_token))
        .route("/auth/userinfo", axum::routing::get(crate::presentation::api::handlers::userinfo))
        .route("/users", axum::routing::post(admin_service::handlers::create_user))
        .route("/users/{id}", axum::routing::get(admin_service::handlers::get_user))
        .route("/users/{id}", axum::routing::post(admin_service::handlers::update_user))
        .route("/users/{id}", axum::routing::delete(admin_service::handlers::delete_user))
        .with_state(app_state_arc.clone())
        .layer(axum::middleware::from_fn_with_state(
            app_state_arc.clone(),
            crate::presentation::api::middleware::auth_middleware,
        ))
        .layer(axum::middleware::from_fn_with_state(
            app_state_arc.clone(),
            crate::presentation::api::middleware::acl_middleware,
        ));
    
    let app = axum::Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .layer(axum::middleware::from_fn(crate::presentation::api::middleware::request_id_middleware))
        .layer(tower_http::cors::CorsLayer::permissive());

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], settings.server.port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    
    info!("Server listening on {}", addr);
    axum::serve(listener, app).await?;

    Ok(())
}
