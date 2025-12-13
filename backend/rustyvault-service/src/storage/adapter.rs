//! Storage adapter that routes between metadata and barrier storage

use std::sync::Arc;
use async_trait::async_trait;
use crate::errors::VaultResult;
use crate::storage::{StorageBackend, MetadataStore, BarrierStore};

/// Storage adapter that routes requests to appropriate storage
pub struct StorageAdapter {
    metadata_store: Arc<MetadataStore>,
    barrier_store: Arc<BarrierStore>,
}

impl StorageAdapter {
    pub fn new(metadata_store: Arc<MetadataStore>, barrier_store: Arc<BarrierStore>) -> Self {
        Self {
            metadata_store,
            barrier_store,
        }
    }

    /// Determine if a key should use metadata storage or barrier storage
    fn is_metadata_key(&self, key: &str) -> bool {
        // Metadata keys: config, mounts, auth methods, policies
        key.starts_with("sys/") || 
        key.starts_with("core/") ||
        key.starts_with("auth/") ||
        key.starts_with("policy/")
    }
}

#[async_trait]
impl StorageBackend for StorageAdapter {
    async fn get(&self, key: &str) -> VaultResult<Option<Vec<u8>>> {
        if self.is_metadata_key(key) {
            self.metadata_store.get(key).await
        } else {
            self.barrier_store.get(key).await
        }
    }

    async fn put(&self, key: &str, value: &[u8]) -> VaultResult<()> {
        if self.is_metadata_key(key) {
            self.metadata_store.put(key, value).await
        } else {
            self.barrier_store.put(key, value).await
        }
    }

    async fn delete(&self, key: &str) -> VaultResult<()> {
        if self.is_metadata_key(key) {
            self.metadata_store.delete(key).await
        } else {
            self.barrier_store.delete(key).await
        }
    }

    async fn list(&self, prefix: &str) -> VaultResult<Vec<String>> {
        if self.is_metadata_key(prefix) {
            self.metadata_store.list(prefix).await
        } else {
            self.barrier_store.list(prefix).await
        }
    }
}

