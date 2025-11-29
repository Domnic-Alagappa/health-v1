use async_trait::async_trait;
use crate::shared::AppResult;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncOperation {
    pub id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub operation: String, // "create", "update", "delete"
    pub data: serde_json::Value,
    pub timestamp: i64,
    pub vector_clock: Vec<(String, u64)>,
}

#[async_trait]
pub trait SyncService: Send + Sync {
    /// Queue operation for sync when offline
    async fn queue_operation(&self, operation: SyncOperation) -> AppResult<()>;
    
    /// Sync operations to live database
    async fn sync_to_live(&self) -> AppResult<usize>;
    
    /// Sync operations from live database
    async fn sync_from_live(&self) -> AppResult<usize>;
    
    /// Get pending operations count
    async fn pending_count(&self) -> AppResult<usize>;
    
    /// Merge conflicts using CRDT logic
    async fn merge_conflicts(&self, local: &SyncOperation, remote: &SyncOperation) -> AppResult<SyncOperation>;
}

