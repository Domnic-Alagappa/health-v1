mod presentation;

use std::net::SocketAddr;
use std::sync::Arc;
use tracing::info;

fn main() -> Result<(), String> {
    // Configure Tokio runtime for low-memory systems
    let tokio_worker_threads: usize = std::env::var("TOKIO_WORKER_THREADS")
        .unwrap_or_else(|_| "2".to_string())
        .parse()
        .unwrap_or(2);
    
    let rt = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(tokio_worker_threads)
        .max_blocking_threads(2)
        .thread_stack_size(256 * 1024) // 256KB stack size
        .enable_all()
        .build()
        .map_err(|e| format!("Failed to create Tokio runtime: {}", e))?;
    
    rt.block_on(async_main())
}

async fn async_main() -> Result<(), String> {
    // Load environment variables
    dotenv::dotenv().ok();

    // Load configuration
    let settings = shared::config::Settings::from_env()
        .map_err(|e| {
            eprintln!("Failed to load configuration: {}", e);
            format!("Failed to load configuration: {}", e)
        })?;

    // Initialize logger with settings and deployment config (single point of control for dev mode)
    shared::infrastructure::logging::init_from_settings_with_deployment(
        &settings.logging,
        &settings.deployment,
    );

    info!("Starting api-service on {}:{}", settings.server.host, settings.server.port);
    info!("Tokio runtime configured: worker_threads={}, max_blocking_threads=2", 
        std::env::var("TOKIO_WORKER_THREADS").unwrap_or_else(|_| "2".to_string()));

    // Initialize database connection using database service
    info!("Connecting to database...");
    use std::time::Duration;
    let pool = shared::infrastructure::database::create_pool_with_options(
        &settings.database.url,
        settings.database.max_connections,
        settings.database.min_connections,
        Duration::from_secs(10),
    )
    .await
    .map_err(|e| format!("Failed to connect to database: {}", e))?;
    info!("Database pool configured: max={}, min={}", 
        settings.database.max_connections, 
        settings.database.min_connections);
    
    // Create shared DatabaseService instance for all repositories
    let database_service = Arc::new(shared::infrastructure::database::DatabaseService::new(pool.clone()));
    
    // Verify database health
    database_service.health_check().await
        .map_err(|e| format!("Database health check failed: {}", e))?;
    info!("Database health check passed");
    
    // Run migrations using sqlx's built-in migrator
    info!("Running database migrations...");
    // Try multiple possible paths for migrations (dev vs prod)
    let migrations_path = if std::path::Path::new("./migrations").exists() {
        std::path::Path::new("./migrations")
    } else if std::path::Path::new("/app/backend/migrations").exists() {
        std::path::Path::new("/app/backend/migrations")
    } else if std::path::Path::new("/app/migrations").exists() {
        std::path::Path::new("/app/migrations")
    } else if std::path::Path::new("../migrations").exists() {
        std::path::Path::new("../migrations")
    } else {
        std::path::Path::new("./migrations")
    };
    info!("Using migrations path: {:?}", migrations_path);
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

    // Initialize Zanzibar services (needed for RoleRepository)
    let relationship_store = Arc::new(shared::infrastructure::zanzibar::RelationshipStore::new(
        Box::new(shared::infrastructure::repositories::RelationshipRepositoryImpl::new(pool.clone())),
    ));
    
    let permission_repository = Arc::new(shared::infrastructure::repositories::PermissionRepositoryImpl::new(pool.clone()));
    
    // Initialize use cases using DatabaseService
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

    // Initialize graph cache for complex authorization queries
    info!("Initializing graph cache...");
    use shared::infrastructure::zanzibar::GraphCache;
    let graph_cache = if settings.graph_cache.enabled {
        Arc::new(GraphCache::new(settings.graph_cache.ttl_seconds, true))
    } else {
        info!("Graph cache disabled");
        Arc::new(GraphCache::disabled())
    };
    info!("Graph cache initialized: enabled={}, ttl={}s", 
        settings.graph_cache.enabled, 
        settings.graph_cache.ttl_seconds);

    // Permission checker (uses relationship_store with optional graph cache)
    let permission_checker = Arc::new(
        shared::infrastructure::zanzibar::PermissionChecker::with_graph_cache(
            shared::infrastructure::zanzibar::RelationshipStore::new(
                Box::new(shared::infrastructure::repositories::RelationshipRepositoryImpl::new(pool.clone())),
            ),
            graph_cache.clone(),
            true, // Enable graph for deep queries
        )
    );

    // Initialize setup components
    let setup_repository = Arc::new(shared::infrastructure::repositories::SetupRepositoryImpl::new(pool.clone()));
    
    let setup_organization_use_case = Arc::new(admin_service::use_cases::setup::SetupOrganizationUseCase::new(
        Box::new(shared::infrastructure::repositories::SetupRepositoryImpl::new(pool.clone())),
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
    ));
    
    let create_super_admin_use_case = Arc::new(admin_service::use_cases::setup::CreateSuperAdminUseCase::new(
        Box::new(shared::infrastructure::repositories::SetupRepositoryImpl::new(pool.clone())),
        Box::new(shared::infrastructure::repositories::UserRepositoryImpl::new(database_service.clone())),
    ));

    // Initialize vault (OpenBao/KMS) first - needed for master key storage
    info!("Initializing vault...");
    use shared::config::providers::ProviderConfig;
    use shared::infrastructure::providers::create_kms_provider;
    let provider_config = ProviderConfig::from_env()
        .map_err(|e| format!("Failed to load provider config: {}", e))?;
    let vault = create_kms_provider(&provider_config.kms)
        .map_err(|e| format!("Failed to create KMS provider: {}", e))?;
    info!("Vault initialized");

    // Initialize master key
    info!("Initializing master key...");
    use shared::infrastructure::encryption::MasterKey;
    use std::path::Path;
    
    // Try to load master key from OpenBao/Vault first (preferred)
    let master_key = match MasterKey::from_vault(vault.as_ref()).await {
        Ok(Some(key)) => {
            info!("Master key loaded from OpenBao/Vault");
            key
        }
        Ok(None) => {
            // Master key doesn't exist in vault - try fallback sources
            info!("Master key not found in OpenBao/Vault, trying fallback sources...");
            
            if let Some(path) = &settings.encryption.master_key_path {
                // Load from file
                match MasterKey::from_file(Path::new(path)) {
                    Ok(key) => {
                        info!("Master key loaded from file (fallback)");
                        // Try to store in vault for future use
                        let _ = key.save_to_vault(vault.as_ref()).await;
                        key
                    }
                    Err(_) => {
                        // Generate new master key
                        info!("Generating new master key...");
                        let key = MasterKey::generate()
                            .map_err(|e| format!("Failed to generate master key: {}", e))?;
                        
                        // Try to store in vault first
                        if let Err(e) = key.save_to_vault(vault.as_ref()).await {
                            tracing::warn!("Failed to store master key in vault: {}, saving to file", e);
                            std::fs::create_dir_all(Path::new(path).parent().unwrap())
                                .map_err(|e| format!("Failed to create master key directory: {}", e))?;
                            key.save_to_file(Path::new(path))
                                .map_err(|e| format!("Failed to save master key: {}", e))?;
                            info!("Generated and saved master key to: {}", path);
                        } else {
                            info!("Generated and stored master key in OpenBao/Vault");
                        }
                        key
                    }
                }
            } else if let Ok(_) = std::env::var("MASTER_KEY") {
                // Load from environment (hex-encoded)
                let key = MasterKey::from_env("MASTER_KEY")
                    .map_err(|e| format!("Failed to load master key from environment: {}", e))?;
                info!("Master key loaded from environment (fallback)");
                // Try to store in vault for future use
                let _ = key.save_to_vault(vault.as_ref()).await;
                key
            } else {
                // Generate new master key (first-time setup)
                info!("Generating new master key...");
                let key = MasterKey::generate()
                    .map_err(|e| format!("Failed to generate master key: {}", e))?;
                
                // Try to store in vault
                if let Err(e) = key.save_to_vault(vault.as_ref()).await {
                    tracing::warn!("Failed to store master key in vault: {}", e);
                    tracing::warn!("Master key generated but not persisted. Set up OpenBao/Vault or MASTER_KEY_PATH/MASTER_KEY env var.");
                } else {
                    info!("Generated and stored master key in OpenBao/Vault");
                }
                key
            }
        }
        Err(e) => {
            tracing::warn!("Failed to retrieve master key from OpenBao/Vault: {}, using fallback", e);
            
            // Fallback to file or environment
            if let Some(path) = &settings.encryption.master_key_path {
                MasterKey::from_file(Path::new(path))
                    .map_err(|e| format!("Failed to load master key from file: {}", e))?
            } else if let Ok(_) = std::env::var("MASTER_KEY") {
                MasterKey::from_env("MASTER_KEY")
                    .map_err(|e| format!("Failed to load master key from environment: {}", e))?
            } else {
                return Err(format!("Cannot load master key. Set up OpenBao/Vault or configure MASTER_KEY_PATH/MASTER_KEY"));
            }
        }
    };
    info!("Master key initialized");

    // Create DEK Manager
    use shared::infrastructure::encryption::DekManager;
    let dek_manager = Arc::new(DekManager::new(master_key, vault));
    info!("DEK Manager initialized");

    // Create role repository (uses relationship_store and permission_repository)
    let role_repository = Arc::new(shared::infrastructure::repositories::RoleRepositoryImpl::new(
        database_service.clone(),
        relationship_store.clone(),
        permission_repository.clone(),
    ));

    // Initialize session service
    info!("Initializing session service...");
    let session_repository = Arc::new(shared::infrastructure::repositories::SessionRepositoryImpl::new(database_service.clone()));
    let session_cache = Arc::new(shared::infrastructure::session::SessionCache::with_max_entries(
        settings.session.cache_max_entries,
    ));
    info!("Session cache configured with max {} entries", settings.session.cache_max_entries);
    let session_service = Arc::new(shared::infrastructure::session::SessionService::new(
        session_repository,
        session_cache,
        settings.session.clone(),
    ));
    info!("Session service initialized");

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
        dek_manager,
        role_repository,
        graph_cache: Some(graph_cache),
        session_service,
    };

    // Build application router with state, middleware, and CORS
    let app_state_arc = Arc::new(app_state);
    
    // Create public routes (no auth required)
    let public_routes = axum::Router::new()
        .route("/health", axum::routing::get(|| async { "OK" }))
        .route("/auth/login", axum::routing::post(crate::presentation::api::handlers::login))
        .route("/setup/status", axum::routing::get(admin_service::handlers::check_setup_status))
        .route("/api/setup/status", axum::routing::get(admin_service::handlers::check_setup_status))
        .route("/setup/initialize", axum::routing::post(admin_service::handlers::initialize_setup))
        .route("/api/setup/initialize", axum::routing::post(admin_service::handlers::initialize_setup))
        .route("/services/status", axum::routing::get(crate::presentation::api::handlers::get_service_status))
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
        // Permission check routes
        .route("/api/admin/permissions/check", axum::routing::post(admin_service::handlers::check_permission))
        .route("/api/admin/permissions/check-batch", axum::routing::post(admin_service::handlers::check_permissions_batch))
        .route("/api/admin/permissions/user/{id}", axum::routing::get(admin_service::handlers::get_user_permissions))
        .route("/api/admin/permissions/user/{id}/pages", axum::routing::get(admin_service::handlers::get_user_pages))
        .route("/api/admin/permissions/user/{id}/buttons/{page}", axum::routing::get(admin_service::handlers::get_user_buttons))
        .route("/api/admin/permissions/user/{id}/fields/{page}", axum::routing::get(admin_service::handlers::get_user_fields))
        // Permission assignment routes
        .route("/api/admin/permissions/assign", axum::routing::post(admin_service::handlers::assign_permission))
        .route("/api/admin/permissions/assign-batch", axum::routing::post(admin_service::handlers::assign_permissions_batch))
        .route("/api/admin/permissions/revoke", axum::routing::delete(admin_service::handlers::revoke_permission))
        // UI Entity routes
        .route("/api/admin/ui/pages", axum::routing::post(admin_service::handlers::register_page))
        .route("/api/admin/ui/pages", axum::routing::get(admin_service::handlers::list_pages))
        .route("/api/admin/ui/pages/{id}/buttons", axum::routing::get(admin_service::handlers::list_buttons_for_page))
        .route("/api/admin/ui/pages/{id}/fields", axum::routing::get(admin_service::handlers::list_fields_for_page))
        .route("/api/admin/ui/buttons", axum::routing::post(admin_service::handlers::register_button))
        .route("/api/admin/ui/fields", axum::routing::post(admin_service::handlers::register_field))
        .route("/api/admin/ui/apis", axum::routing::post(admin_service::handlers::register_api))
        .route("/api/admin/ui/apis", axum::routing::get(admin_service::handlers::list_apis))
        // Groups routes
        .route("/api/admin/groups", axum::routing::get(admin_service::handlers::list_groups))
        .route("/api/admin/groups", axum::routing::post(admin_service::handlers::create_group))
        .route("/api/admin/groups/{id}", axum::routing::get(admin_service::handlers::get_group))
        .route("/api/admin/groups/{id}", axum::routing::delete(admin_service::handlers::delete_group))
        .route("/api/admin/groups/{group_id}/users/{user_id}", axum::routing::post(admin_service::handlers::add_user_to_group))
        .route("/api/admin/groups/{group_id}/users/{user_id}", axum::routing::delete(admin_service::handlers::remove_user_from_group))
        .route("/api/admin/groups/{group_id}/roles/{role_id}", axum::routing::post(admin_service::handlers::assign_role_to_group))
        // Dashboard routes
        .route("/api/admin/dashboard/stats", axum::routing::get(admin_service::handlers::get_dashboard_stats))
        .with_state(app_state_arc.clone())
        .layer(axum::middleware::from_fn_with_state(
            app_state_arc.clone(),
            crate::presentation::api::middleware::acl_middleware,
        ))
        .layer(axum::middleware::from_fn_with_state(
            app_state_arc.clone(),
            crate::presentation::api::middleware::auth_middleware,
        ));
    
    let app = axum::Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        // Middleware order (from outer to inner):
        // 1. Request ID middleware - generates request ID
        // 2. Session middleware - creates/gets session, extracts IP
        // 3. Request logging middleware - logs requests (runs before and after handler)
        .layer(axum::middleware::from_fn_with_state(
            app_state_arc.clone(),
            crate::presentation::api::middleware::request_logging_middleware,
        ))
        .layer(axum::middleware::from_fn_with_state(
            app_state_arc.clone(),
            crate::presentation::api::middleware::session_middleware,
        ))
        .layer(axum::middleware::from_fn(crate::presentation::api::middleware::request_id_middleware))
        .layer({
            // Build CORS layer with app-specific origins (required for credentials)
            // Combine all allowed origins from both admin-ui and client-ui
            let mut all_origins: Vec<String> = settings.session.admin_ui_cors_origins.clone();
            all_origins.extend(settings.session.client_ui_cors_origins.clone());
            // Also include legacy shared origins for backward compatibility
            all_origins.extend(settings.server.cors_allowed_origins.clone());
            // Remove duplicates
            all_origins.sort();
            all_origins.dedup();
            
            let origins: Vec<axum::http::HeaderValue> = all_origins
                .iter()
                .filter_map(|origin| origin.parse().ok())
                .collect();
            
            tower_http::cors::CorsLayer::new()
                .allow_credentials(true)
                .allow_origin(tower_http::cors::AllowOrigin::list(origins))
                .allow_methods([
                    axum::http::Method::GET,
                    axum::http::Method::POST,
                    axum::http::Method::PUT,
                    axum::http::Method::DELETE,
                    axum::http::Method::PATCH,
                    axum::http::Method::OPTIONS,
                ])
                .allow_headers([
                    axum::http::header::CONTENT_TYPE,
                    axum::http::header::AUTHORIZATION,
                    axum::http::header::ACCEPT,
                    axum::http::HeaderName::from_static("x-request-id"),
                    axum::http::HeaderName::from_static("x-request-timestamp"),
                    axum::http::HeaderName::from_static("x-session-token"),
                    axum::http::HeaderName::from_static("x-app-type"),
                    axum::http::HeaderName::from_static("x-app-device"),
                ])
                .expose_headers([
                    axum::http::HeaderName::from_static("x-request-id"),
                ])
        });

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], settings.server.port));
    let listener = tokio::net::TcpListener::bind(addr).await
        .map_err(|e| format!("Failed to bind to address {}: {}", addr, e))?;
    
    info!("Server listening on {}", addr);
    axum::serve(listener, app).await
        .map_err(|e| format!("Server error: {}", e))?;

    Ok(())
}
