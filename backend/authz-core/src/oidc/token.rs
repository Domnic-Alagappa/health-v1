//! Re-export TokenManager from shared crate
//! This module provides a compatibility layer for authz-core to use the shared TokenManager

pub use shared::infrastructure::oidc::{TokenManager, Claims};

