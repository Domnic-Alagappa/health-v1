use sqlx::SqlitePool;
use crate::shared::AppResult;

pub struct LocalDb {
    pool: SqlitePool,
}

impl LocalDb {
    pub async fn new(db_path: &str) -> AppResult<Self> {
        let pool = SqlitePool::connect(db_path).await?;
        Ok(Self { pool })
    }

    pub fn pool(&self) -> &SqlitePool {
        &self.pool
    }
}

