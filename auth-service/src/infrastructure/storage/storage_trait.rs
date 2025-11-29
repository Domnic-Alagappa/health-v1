use async_trait::async_trait;
use crate::shared::AppResult;

#[async_trait]
pub trait Storage: Send + Sync {
    async fn put(&self, key: &str, data: &[u8]) -> AppResult<()>;
    async fn get(&self, key: &str) -> AppResult<Option<Vec<u8>>>;
    async fn delete(&self, key: &str) -> AppResult<()>;
    async fn list(&self, prefix: &str) -> AppResult<Vec<String>>;
}

