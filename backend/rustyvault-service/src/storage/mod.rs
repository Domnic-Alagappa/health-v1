//! Storage layer for vault
//!
//! Hybrid storage: health-v1 DB for metadata, RustyVault barrier for secrets

pub mod storage_backend;
pub mod metadata_store;
pub mod barrier_store;
pub mod adapter;
pub mod barrier;
pub mod barrier_aes_gcm;
pub mod physical_file;

pub use storage_backend::StorageBackend;
pub use metadata_store::MetadataStore;
pub use barrier_store::BarrierStore;
pub use adapter::StorageAdapter;
pub use barrier::SecurityBarrier;

/// Path for barrier initialization data
pub const BARRIER_INIT_PATH: &str = "core/barrier-init";

