mod config;
mod shared;
mod domain;
mod infrastructure;
mod application;
mod presentation;

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
    let settings = config::Settings::from_env()
        .map_err(|e| format!("Failed to load configuration: {}", e))?;

    info!("Starting auth-service on {}:{}", settings.server.host, settings.server.port);

    // Initialize database connection using database service
    info!("Connecting to database...");
    let pool = infrastructure::database::create_pool(&settings.database.url).await
        .map_err(|e| format!("Failed to connect to database: {}", e))?;
    
    // Create shared DatabaseService instance for all repositories
    let database_service = Arc::new(infrastructure::database::DatabaseService::new(pool.clone()));
    
    // Verify database health
    database_service.health_check().await
        .map_err(|e| format!("Database health check failed: {}", e))?;
    info!("Database health check passed");
    
    // Run migrations
    info!("Running database migrations...");
    let migrations_dir = std::path::Path::new("./migrations");
    infrastructure::database::migrations::run_migrations(&pool, migrations_dir).await
        .map_err(|e| format!("Failed to run migrations: {}", e))?;
    
    info!("Database migrations completed");

    // Initialize repositories (we'll create instances as needed for use cases)
    // Note: Each use case gets its own repository instance sharing the same pool

    // Initialize token manager (create multiple instances for different use cases)
    let token_manager_for_state = infrastructure::oidc::TokenManager::new(
        &settings.oidc.jwt_secret,
        settings.oidc.issuer.clone(),
        settings.oidc.jwt_expiration,
    );
    let token_manager_arc = Arc::new(token_manager_for_state);
    
    let token_manager_clone = infrastructure::oidc::TokenManager::new(
        &settings.oidc.jwt_secret,
        settings.oidc.issuer.clone(),
        settings.oidc.jwt_expiration,
    );
    
    let token_manager_clone2 = infrastructure::oidc::TokenManager::new(
        &settings.oidc.jwt_secret,
        settings.oidc.issuer.clone(),
        settings.oidc.jwt_expiration,
    );

    // Initialize use cases using DatabaseService
    let get_permissions_use_case = application::use_cases::auth::GetUserPermissionsUseCase::new(
        Box::new(infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
        Box::new(infrastructure::repositories::RoleRepositoryImpl::new(database_service.clone())),
        Box::new(infrastructure::repositories::PermissionRepositoryImpl::new(database_service.clone())),
    );

    let login_use_case = Arc::new(application::use_cases::auth::LoginUseCase::new(
        Box::new(infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
        Box::new(infrastructure::repositories::RefreshTokenRepositoryImpl::new(database_service.clone())),
        Box::new(infrastructure::repositories::RoleRepositoryImpl::new(database_service.clone())),
        Box::new(infrastructure::repositories::PermissionRepositoryImpl::new(database_service.clone())),
        token_manager_clone,
    ));

    let refresh_token_use_case = Arc::new(application::use_cases::auth::RefreshTokenUseCase::new(
        Box::new(infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
        Box::new(infrastructure::repositories::RefreshTokenRepositoryImpl::new(database_service.clone())),
        token_manager_clone2,
    ));

    let logout_use_case = Arc::new(application::use_cases::auth::LogoutUseCase::new(
        Box::new(infrastructure::repositories::RefreshTokenRepositoryImpl::new(database_service.clone())),
    ));

    let userinfo_use_case = Arc::new(application::use_cases::auth::UserInfoUseCase::new(
        Box::new(infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
        get_permissions_use_case,
    ));

    // Initialize Zanzibar services
    let relationship_store = Arc::new(infrastructure::zanzibar::RelationshipStore::new(
        Box::new(infrastructure::repositories::RelationshipRepositoryImpl::new(database_service.clone())),
    ));
    
    let permission_checker = Arc::new(infrastructure::zanzibar::PermissionChecker::new(
        infrastructure::zanzibar::RelationshipStore::new(
            Box::new(infrastructure::repositories::RelationshipRepositoryImpl::new(database_service.clone())),
        ),
    ));

    // Initialize setup components
    let setup_repository = Arc::new(infrastructure::repositories::SetupRepositoryImpl::new(database_service.clone()));
    let user_repository_for_setup = Box::new(infrastructure::repositories::UserRepositoryImpl::new(database_service.clone()));
    
    let setup_organization_use_case = Arc::new(application::use_cases::setup::SetupOrganizationUseCase::new(
        Box::new(infrastructure::repositories::SetupRepositoryImpl::new(database_service.clone())),
        user_repository_for_setup.clone(),
    ));
    
    let create_super_admin_use_case = Arc::new(application::use_cases::setup::CreateSuperAdminUseCase::new(
        Box::new(infrastructure::repositories::SetupRepositoryImpl::new(database_service.clone())),
        user_repository_for_setup,
    ));

    // Create application state
    let app_state = shared::AppState {
        database_service: database_service.clone(),
        database_service: database_service.clone(),
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
        .route("/auth/login", axum::routing::post(presentation::api::handlers::login))
        .route("/api/setup/status", axum::routing::get(presentation::api::handlers::check_setup_status))
        .route("/api/setup/initialize", axum::routing::post(presentation::api::handlers::initialize_setup))
        .route("/api/services/status", axum::routing::get(presentation::api::handlers::get_service_status))
        .with_state(app_state_arc.clone());
    
    // Create protected routes with middleware
    let protected_routes = axum::Router::new()
        .route("/auth/logout", axum::routing::post(presentation::api::handlers::logout))
        .route("/auth/token", axum::routing::post(presentation::api::handlers::refresh_token))
        .route("/auth/userinfo", axum::routing::get(presentation::api::handlers::userinfo))
        .route("/users", axum::routing::post(presentation::api::handlers::create_user))
        .route("/users/:id", axum::routing::get(presentation::api::handlers::get_user))
        .route("/users/:id", axum::routing::post(presentation::api::handlers::update_user))
        .route("/users/:id", axum::routing::delete(presentation::api::handlers::delete_user))
        .with_state(app_state_arc.clone())
        .layer(axum::middleware::from_fn_with_state(
            app_state_arc.clone(),
            presentation::api::middleware::auth_middleware,
        ))
        .layer(axum::middleware::from_fn_with_state(
            app_state_arc.clone(),
            presentation::api::middleware::acl_middleware,
        ));
    
    let app = axum::Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .layer(axum::middleware::from_fn(presentation::api::middleware::request_id_middleware))
        .layer(tower_http::cors::CorsLayer::permissive());

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], settings.server.port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    
    info!("Server listening on {}", addr);
    axum::serve(listener, app).await?;

    Ok(())
}
