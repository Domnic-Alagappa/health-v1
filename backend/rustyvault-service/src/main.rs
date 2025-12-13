mod core;
mod errors;
mod logical;
mod modules;
mod router;
mod storage;
mod http;
mod config;
mod shamir;

use std::net::SocketAddr;
use std::sync::Arc;
use tracing::info;
use tracing_subscriber;

fn main() -> Result<(), String> {
    // Configure Tokio runtime
    let tokio_worker_threads: usize = std::env::var("TOKIO_WORKER_THREADS")
        .unwrap_or_else(|_| "2".to_string())
        .parse()
        .unwrap_or(2);
    
    let rt = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(tokio_worker_threads)
        .max_blocking_threads(2)
        .thread_stack_size(256 * 1024)
        .enable_all()
        .build()
        .map_err(|e| format!("Failed to create Tokio runtime: {}", e))?;
    
    rt.block_on(async_main())
}

async fn async_main() -> Result<(), String> {
    // Load environment variables
    dotenv::dotenv().ok();

    // Load configuration
    let settings = config::VaultSettings::from_env()
        .map_err(|e| {
            eprintln!("Failed to load configuration: {}", e);
            format!("Failed to load configuration: {}", e)
        })?;

    // Initialize logger using tracing_subscriber directly
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .with_target(true)
        .init();

    info!("Starting rustyvault-service on {}:{}", settings.server.host, settings.server.port);

    // Initialize database connection
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
    
    // Verify database health
    let database_service = Arc::new(shared::infrastructure::database::DatabaseService::new(pool.clone()));
    database_service.health_check().await
        .map_err(|e| format!("Database health check failed: {}", e))?;
    info!("Database health check passed");
    
    // Run migrations
    info!("Running database migrations...");
    let migrations_path = if std::path::Path::new("./migrations").exists() {
        std::path::Path::new("./migrations")
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

    // Initialize physical storage for barrier data
    let storage_path = settings.storage.path
        .unwrap_or_else(|| "./vault-data".to_string());
    let physical_backend = Arc::new(storage::physical_file::FileBackend::new(&storage_path)
        .map_err(|e| format!("Failed to create file backend: {}", e))?);

    // Initialize storage
    let metadata_store = Arc::new(storage::MetadataStore::new(Arc::new(pool.clone())));
    let barrier_store = Arc::new(storage::BarrierStore::new(physical_backend.clone()));
    let storage_adapter = Arc::new(storage::StorageAdapter::new(
        metadata_store,
        barrier_store.clone(),
    ));

    // Initialize vault core
    let vault_core = Arc::new(core::VaultCore::new(storage_adapter));
    
    // Register default KV backend at "secret" mount
    let kv_backend = Arc::new(modules::kv::KvBackend::new(
        barrier_store.barrier(),
        "secret".to_string(),
    ));
    vault_core.router.add_backend("secret".to_string(), kv_backend);
    
    info!("Vault core initialized");

    // Initialize policy store
    let policy_store = Arc::new(modules::policy::PolicyStore::new(pool.clone()));
    policy_store.init().await
        .map_err(|e| format!("Failed to initialize policy store: {}", e))?;
    info!("Policy store initialized");

    // Initialize token store
    let token_store = Arc::new(modules::auth::TokenStore::new(pool.clone()));
    info!("Token store initialized");

    // Initialize UserPass backend
    let userpass_backend = Arc::new(modules::auth::UserPassBackend::new(
        pool.clone(),
        "auth/userpass",
    ));
    info!("UserPass backend initialized");

    // Create app state
    let app_state = Arc::new(http::routes::AppState {
        core: vault_core,
        policy_store: Some(policy_store),
        token_store: Some(token_store),
        userpass: Some(userpass_backend),
    });

    // Create router - using closures to capture state
    let app = http::routes::create_router(app_state);

    // Start server - need to convert Router<Arc<AppState>> to service
    let addr = SocketAddr::from(([0, 0, 0, 0], settings.server.port));
    let listener = tokio::net::TcpListener::bind(addr).await
        .map_err(|e| format!("Failed to bind to address {}: {}", addr, e))?;
    
    info!("RustyVault service listening on {}", addr);
    // Router<Arc<AppState>> needs IntoMakeService - the router has state already filled
    axum::serve(listener, app).await
        .map_err(|e| format!("Server error: {}", e))?;
    
    Ok(())
}

