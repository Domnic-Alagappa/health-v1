use crate::infrastructure::database::crdt::Crdt;
use crate::shared::AppResult;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncState {
    pub node_id: String,
    pub last_sync_timestamp: i64,
    pub vector_clock: Vec<(String, u64)>,
}

pub trait SyncProtocol {
    /// Prepare sync state for sending
    fn prepare_sync(&self, node_id: &str) -> AppResult<SyncState>;
    
    /// Apply remote sync state
    fn apply_sync(&mut self, remote_state: &SyncState) -> AppResult<()>;
    
    /// Get changes since last sync
    fn get_changes_since(&self, timestamp: i64) -> AppResult<Vec<Crdt>>;
    
    /// Apply remote changes
    fn apply_changes(&mut self, changes: Vec<Crdt>) -> AppResult<()>;
}

