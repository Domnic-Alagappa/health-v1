use sqlx::PgPool;
use crate::shared::AppResult;

pub struct LiveDb {
    pool: PgPool,
}

impl LiveDb {
    pub async fn new(database_url: &str) -> AppResult<Self> {
        let pool = PgPool::connect(database_url).await?;
        Ok(Self { pool })
    }

    pub fn pool(&self) -> &PgPool {
        &self.pool
    }
}

