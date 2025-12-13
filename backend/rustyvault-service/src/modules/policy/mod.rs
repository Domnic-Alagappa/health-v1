//! Policy module for RustyVault
//!
//! This module implements the Access Control List (ACL) system for RustyVault.
//! It provides:
//! - Policy structures for defining access rules
//! - ACL evaluation engine
//! - Policy storage with PostgreSQL backend

pub mod acl;
pub mod policy;
pub mod policy_store;

// Re-export commonly used types
pub use policy::Policy;
pub use policy_store::PolicyStore;
