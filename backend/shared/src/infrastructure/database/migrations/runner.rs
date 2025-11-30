use sqlx::{PgPool, Postgres, Transaction};
use crate::shared::AppResult;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{Duration, Instant};
use tracing::{info, warn, error};

/// Configuration for migration execution
#[derive(Debug, Clone)]
pub struct MigrationConfig {
    /// Query timeout per statement (default: 30s)
    pub query_timeout: Duration,
    /// Delay between statements to prevent database overload (default: 10ms)
    pub statement_delay: Duration,
    /// Maximum retry attempts for transient failures (default: 3)
    pub max_retries: u32,
    /// Retry delay base (exponential backoff) (default: 100ms)
    pub retry_delay_base: Duration,
}

impl Default for MigrationConfig {
    fn default() -> Self {
        Self {
            query_timeout: Duration::from_secs(30),
            statement_delay: Duration::from_millis(10),
            max_retries: 3,
            retry_delay_base: Duration::from_millis(100),
        }
    }
}

/// Parse SQL statements, handling dollar-quoted strings and complex blocks
pub(crate) fn parse_sql_statements(sql: &str) -> Vec<String> {
    let mut statements = Vec::new();
    let mut current_statement = String::new();
    let mut in_dollar_quote = false;
    let mut dollar_tag: Option<String> = None;
    let mut chars = sql.chars().peekable();
    
    while let Some(ch) = chars.next() {
        if !in_dollar_quote && ch == '$' {
            // Check for dollar-quoted string start
            let mut tag = String::new();
            let mut peek_iter = chars.clone();
            
            // Collect the tag (if any)
            while let Some(&next_ch) = peek_iter.peek() {
                if next_ch == '$' {
                    peek_iter.next();
                    let full_tag = format!("${}$", tag);
                    dollar_tag = Some(full_tag.clone());
                    in_dollar_quote = true;
                    current_statement.push('$');
                    current_statement.push_str(&tag);
                    current_statement.push('$');
                    // Skip the tag characters we just processed
                    for _ in 0..tag.len() {
                        chars.next();
                    }
                    chars.next(); // Skip the closing $
                    break;
                } else if next_ch.is_alphanumeric() || next_ch == '_' {
                    tag.push(next_ch);
                    peek_iter.next();
                } else {
                    // Not a dollar quote, just a regular $
                    current_statement.push(ch);
                    break;
                }
            }
            continue;
        }
        
        if in_dollar_quote {
            current_statement.push(ch);
            // Check for end of dollar-quoted string
            if let Some(ref tag) = dollar_tag {
                if current_statement.ends_with(tag) {
                    in_dollar_quote = false;
                    dollar_tag = None;
                }
            }
        } else {
            current_statement.push(ch);
            
            // Check for statement terminator (semicolon) outside of quotes
            if ch == ';' {
                let trimmed = current_statement.trim();
                if !trimmed.is_empty() && !trimmed.starts_with("--") {
                    statements.push(trimmed.to_string());
                }
                current_statement.clear();
            }
        }
    }
    
    // Add remaining statement if any
    let trimmed = current_statement.trim();
    if !trimmed.is_empty() && !trimmed.starts_with("--") {
        statements.push(trimmed.to_string());
    }
    
    statements
}

/// Check if a migration has already been executed
async fn is_migration_executed(
    tx: &mut Transaction<'_, Postgres>,
    version: &str,
) -> Result<bool, sqlx::Error> {
    let result: Option<(bool,)> = sqlx::query_as(
        "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = $1)"
    )
    .bind(version)
    .fetch_optional(&mut **tx)
    .await?;
    
    Ok(result.map(|(exists,)| exists).unwrap_or(false))
}

/// Record a migration as executed
async fn record_migration(
    tx: &mut Transaction<'_, Postgres>,
    version: &str,
    name: &str,
    execution_time_ms: i64,
    checksum: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO schema_migrations (version, name, execution_time_ms, checksum) 
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (version) DO NOTHING"
    )
    .bind(version)
    .bind(name)
    .bind(execution_time_ms)
    .bind(checksum)
    .execute(&mut **tx)
    .await?;
    
    Ok(())
}

/// Execute a single SQL statement with retry logic
async fn execute_statement_with_retry(
    tx: &mut Transaction<'_, Postgres>,
    statement: &str,
    config: &MigrationConfig,
) -> AppResult<()> {
    let mut attempt = 0;
    let mut delay = config.retry_delay_base;
    
    loop {
        match tokio::time::timeout(config.query_timeout, sqlx::query(statement).execute(&mut **tx)).await {
            Ok(Ok(_)) => return Ok(()),
            Ok(Err(e)) => {
                // Check if error is retryable
                let error_code = e.as_database_error()
                    .and_then(|db_err| db_err.code().map(|c| c.to_string()));
                let is_retryable = matches!(
                    error_code.as_deref(),
                    Some("40001") | Some("40P01") | Some("55P03") // Serialization, deadlock, lock_not_available
                ) || e.to_string().contains("connection") || e.to_string().contains("timeout");
                
                if is_retryable && attempt < config.max_retries {
                    attempt += 1;
                    warn!("Retrying statement (attempt {}/{}): {}", attempt, config.max_retries, e);
                    tokio::time::sleep(delay).await;
                    delay *= 2; // Exponential backoff
                    continue;
                }
                return Err(crate::shared::AppError::Database(e));
            }
            Err(_) => {
                if attempt < config.max_retries {
                    attempt += 1;
                    warn!("Query timeout, retrying (attempt {}/{})", attempt, config.max_retries);
                    tokio::time::sleep(delay).await;
                    delay *= 2;
                    continue;
                }
                return Err(crate::shared::AppError::Internal(
                    format!("Query timeout after {} attempts", config.max_retries)
                ));
            }
        }
    }
}

/// Extract migration version and name from filename
fn parse_migration_filename(filename: &str) -> Option<(String, String)> {
    // Format: 0001_name.up.sql or 0001_name.down.sql
    if let Some(stem) = filename.strip_suffix(".up.sql")
        .or_else(|| filename.strip_suffix(".down.sql")) {
        if let Some(underscore_pos) = stem.find('_') {
            let version = stem[..underscore_pos].to_string();
            let name = stem[underscore_pos + 1..].to_string();
            return Some((version, name));
        }
    }
    None
}

/// Calculate simple checksum for migration content
fn calculate_checksum(content: &str) -> String {
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(content.as_bytes());
    format!("{:x}", hasher.finalize())
}

/// Run all pending migrations
pub async fn run_migrations(
    pool: &PgPool,
    migrations_dir: &Path,
) -> AppResult<()> {
    run_migrations_with_config(pool, migrations_dir, MigrationConfig::default()).await
}

/// Run migrations with custom configuration
pub async fn run_migrations_with_config(
    pool: &PgPool,
    migrations_dir: &Path,
    config: MigrationConfig,
) -> AppResult<()> {
    // Ensure schema_migrations table exists (run migration 0000 if needed)
    ensure_migration_table(pool).await?;
    
    // Use a single dedicated connection for migrations to avoid pool exhaustion
    let mut conn = pool.acquire().await
        .map_err(|e| crate::shared::AppError::Database(e))?;
    
    // Read and sort migration files
    let mut entries: Vec<PathBuf> = fs::read_dir(migrations_dir)
        .map_err(|e| crate::shared::AppError::Internal(format!("Failed to read migrations directory: {}", e)))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry.path()
                .file_name()
                .and_then(|n| n.to_str())
                .map(|n| n.ends_with(".up.sql"))
                .unwrap_or(false)
        })
        .map(|entry| entry.path())
        .collect();
    
    entries.sort();
    
    info!("Found {} migration files", entries.len());
    
    // Process each migration in a transaction
    for entry in entries {
        let filename = entry.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();
        
        let (version, name) = match parse_migration_filename(&filename) {
            Some((v, n)) => (v, n),
            None => {
                warn!("Skipping migration with invalid filename: {}", filename);
                continue;
            }
        };
        
        // Skip migration 0000 (schema_migrations table) as it's handled separately
        if version == "0000" {
            continue;
        }
        
        // Start transaction for this migration
        let mut tx = sqlx::Connection::begin(&mut *conn).await
            .map_err(|e| crate::shared::AppError::Database(e))?;
        
        // Check if already executed
        match is_migration_executed(&mut tx, &version).await {
            Ok(true) => {
                info!("Migration {} ({}) already executed, skipping", version, name);
                tx.commit().await.map_err(|e| crate::shared::AppError::Database(e))?;
                continue;
            }
            Ok(false) => {
                // Proceed with migration
            }
            Err(e) => {
                error!("Error checking migration status: {}", e);
                return Err(crate::shared::AppError::Database(e));
            }
        }
        
        info!("Running migration: {} ({})", version, name);
        let start_time = Instant::now();
        
        // Read migration file
        let sql = fs::read_to_string(&entry)
            .map_err(|e| crate::shared::AppError::Internal(
                format!("Failed to read migration file {}: {}", filename, e)
            ))?;
        
        let checksum = calculate_checksum(&sql);
        
        // Parse SQL statements
        let statements = parse_sql_statements(&sql);
        info!("Parsed {} statements from migration {}", statements.len(), version);
        
        // Execute each statement
        for (idx, statement) in statements.iter().enumerate() {
            if statement.trim().is_empty() || statement.trim().starts_with("--") {
                continue;
            }
            
            // Add delay between statements to prevent database overload
            if idx > 0 {
                tokio::time::sleep(config.statement_delay).await;
            }
            
            match execute_statement_with_retry(&mut tx, statement, &config).await {
                Ok(_) => {
                    // Statement executed successfully
                }
                Err(e) => {
                    error!("Error executing statement {} in migration {}: {}", idx + 1, version, e);
                    let _ = tx.rollback().await;
                    return Err(crate::shared::AppError::Internal(
                        format!("Migration {} failed at statement {}: {}", version, idx + 1, e)
                    ));
                }
            }
        }
        
        let execution_time = start_time.elapsed();
        let execution_time_ms = execution_time.as_millis() as i64;
        
        // Record migration as executed
        if let Err(e) = record_migration(&mut tx, &version, &name, execution_time_ms, Some(&checksum)).await {
            error!("Error recording migration: {}", e);
            let _ = tx.rollback().await;
            return Err(crate::shared::AppError::Database(e));
        }
        
        // Commit transaction
        tx.commit().await
            .map_err(|e| crate::shared::AppError::Database(e))?;
        
        info!("Migration {} ({}) completed in {:?}", version, name, execution_time);
    }
    
    info!("All migrations completed successfully");
    Ok(())
}

/// Ensure the schema_migrations table exists
async fn ensure_migration_table(pool: &PgPool) -> AppResult<()> {
    // Check if table exists
    let exists: Option<(bool,)> = sqlx::query_as(
        "SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'schema_migrations'
        )"
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| crate::shared::AppError::Database(e))?;
    
    if exists.map(|(e,)| e).unwrap_or(false) {
        return Ok(());
    }
    
    // Create the table
    info!("Creating schema_migrations table");
    sqlx::query(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            execution_time_ms BIGINT,
            checksum VARCHAR(64)
        )"
    )
    .execute(pool)
    .await
    .map_err(|e| crate::shared::AppError::Database(e))?;
    
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_schema_migrations_executed_at ON schema_migrations(executed_at)"
    )
    .execute(pool)
    .await
    .map_err(|e| crate::shared::AppError::Database(e))?;
    
    Ok(())
}
