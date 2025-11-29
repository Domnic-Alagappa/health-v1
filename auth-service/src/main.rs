mod config;
mod shared;
mod domain;
mod infrastructure;
mod application;
mod presentation;

use std::net::SocketAddr;
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

    // Build application router
    let app = presentation::api::routes::create_router();

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], settings.server.port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    
    info!("Server listening on {}", addr);
    axum::serve(listener, app).await?;

    Ok(())
}
