use sqlx::PgPool;
use crate::shared::AppResult;
use std::fs;
use std::path::Path;

pub async fn run_migrations(pool: &PgPool, migrations_dir: &Path) -> AppResult<()> {
    let mut entries: Vec<_> = fs::read_dir(migrations_dir)
        .map_err(|e| crate::shared::AppError::Internal(format!("Failed to read migrations directory: {}", e)))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry.path()
                .file_name()
                .and_then(|n| n.to_str())
                .map(|n| n.ends_with(".up.sql"))
                .unwrap_or(false)
        })
        .collect();

    // Sort by filename to ensure correct order
    entries.sort_by_key(|e| e.file_name());

    for entry in entries {
        let path = entry.path();
        let filename = path.file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown");

        tracing::info!("Running migration: {}", filename);

        let sql = fs::read_to_string(&path)
            .map_err(|e| crate::shared::AppError::Internal(format!("Failed to read migration file {}: {}", filename, e)))?;

        // Execute each statement separately
        // Simple approach: split by semicolon, but skip empty and comments
        let statements: Vec<&str> = sql
            .split(';')
            .map(|s| s.trim())
            .filter(|s| !s.is_empty() && !s.starts_with("--"))
            .collect();

        for statement in statements {
            if statement.is_empty() {
                continue;
            }
            
            sqlx::query(statement)
                .execute(pool)
                .await
                .map_err(|e| crate::shared::AppError::Database(e))?;
        }
    }

    Ok(())
}

