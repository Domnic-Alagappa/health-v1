//! Barrier storage for encrypted secrets
//!
//! Uses RustyVault's barrier encryption to store secrets

use std::sync::Arc;
use async_trait::async_trait;
use crate::errors::VaultResult;
use crate::storage::{StorageBackend, barrier_aes_gcm::AESGCMBarrier};

/// Barrier store for encrypted secrets
pub struct BarrierStore {
    barrier: Arc<AESGCMBarrier>,
}

impl BarrierStore {
    pub fn new(backend: Arc<dyn StorageBackend>) -> Self {
        Self {
            barrier: Arc::new(AESGCMBarrier::new(backend)),
        }
    }

    pub fn barrier(&self) -> Arc<AESGCMBarrier> {
        self.barrier.clone()
    }
}

#[async_trait]
impl StorageBackend for BarrierStore {
    async fn get(&self, key: &str) -> VaultResult<Option<Vec<u8>>> {
        self.barrier.get(key).await
    }

    async fn put(&self, key: &str, value: &[u8]) -> VaultResult<()> {
        self.barrier.put(key, value).await
    }

    async fn delete(&self, key: &str) -> VaultResult<()> {
        self.barrier.delete(key).await
    }

    async fn list(&self, prefix: &str) -> VaultResult<Vec<String>> {
        self.barrier.list(prefix).await
    }
}

