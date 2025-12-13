//! RustyVault Service - Vault functionality integrated with health-v1 infrastructure
//!
//! This crate provides Hashicorp Vault-compatible secrets management functionality
//! while leveraging health-v1's shared infrastructure (database, logging, config).

pub mod core;
pub mod errors;
pub mod logical;
pub mod modules;
pub mod router;
pub mod storage;
pub mod http;
pub mod config;
pub mod shamir;

// Re-export commonly used types
pub use errors::VaultError;
pub use logical::{Request, Response};
pub use shamir::ShamirSecret;

