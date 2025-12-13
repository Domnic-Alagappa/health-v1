//! Storage backend trait

use async_trait::async_trait;
use crate::errors::VaultResult;

/// Trait for storage backends
#[async_trait]
pub trait StorageBackend: Send + Sync {
    /// Get a value by key
    async fn get(&self, key: &str) -> VaultResult<Option<Vec<u8>>>;

    /// Put a value by key
    async fn put(&self, key: &str, value: &[u8]) -> VaultResult<()>;

    /// Delete a value by key
    async fn delete(&self, key: &str) -> VaultResult<()>;

    /// List keys with prefix
    async fn list(&self, prefix: &str) -> VaultResult<Vec<String>>;
}

