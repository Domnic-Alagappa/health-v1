use crate::infrastructure::database::{LocalDb, LiveDb};
use crate::shared::AppResult;

pub async fn create_local_db(config: &crate::config::providers::SqliteConfig) -> AppResult<LocalDb> {
    LocalDb::new(&config.path).await
}

pub async fn create_live_db(config: &crate::config::providers::PostgresConfig) -> AppResult<LiveDb> {
    LiveDb::new(&config.url).await
}

// Re-export for convenience
pub use create_local_db as create_local;
pub use create_live_db as create_live;

