use sqlx::PgPool;
use crate::shared::AppResult;
use std::time::Duration;

/// Reusable database service for common database operations
pub struct DatabaseService {
    pool: PgPool,
}

impl DatabaseService {
    /// Create a new database service from an existing pool
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    /// Get a reference to the underlying pool
    pub fn pool(&self) -> &PgPool {
        &self.pool
    }

    /// Check database health with a simple query
    pub async fn health_check(&self) -> AppResult<bool> {
        sqlx::query("SELECT 1")
            .execute(&self.pool)
            .await
            .map(|_| true)
            .map_err(|e| crate::shared::AppError::Database(e))
    }

    /// Check database health with timeout
    pub async fn health_check_with_timeout(&self, timeout: Duration) -> AppResult<bool> {
        tokio::time::timeout(timeout, self.health_check())
            .await
            .map_err(|_| {
                crate::shared::AppError::Internal("Database health check timeout".to_string())
            })?
    }

    /// Get database connection info
    pub async fn get_connection_info(&self) -> AppResult<String> {
        let row: (String,) = sqlx::query_as("SELECT version()")
            .fetch_one(&self.pool)
            .await
            .map_err(|e| crate::shared::AppError::Database(e))?;
        Ok(row.0)
    }

    /// Get active connection count
    pub fn active_connections(&self) -> u32 {
        self.pool.size()
    }

    /// Get idle connection count
    pub fn idle_connections(&self) -> usize {
        self.pool.num_idle()
    }

    /// Test database connectivity
    pub async fn test_connection(&self) -> AppResult<()> {
        self.health_check().await?;
        Ok(())
    }

    /// Execute a raw SQL query (for migrations, etc.)
    pub async fn execute_raw(&self, sql: &str) -> AppResult<u64> {
        sqlx::query(sql)
            .execute(&self.pool)
            .await
            .map(|r| r.rows_affected())
            .map_err(|e| crate::shared::AppError::Database(e))
    }
}

/// Create a new database pool from connection URL
pub async fn create_pool(database_url: &str) -> AppResult<PgPool> {
    PgPool::connect(database_url)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
}

/// Create a database pool with configuration options
pub async fn create_pool_with_options(
    database_url: &str,
    max_connections: u32,
    min_connections: u32,
    _connect_timeout: Duration,
) -> AppResult<PgPool> {
    sqlx::postgres::PgPoolOptions::new()
        .max_connections(max_connections)
        .min_connections(min_connections)
        .connect(database_url)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
}

