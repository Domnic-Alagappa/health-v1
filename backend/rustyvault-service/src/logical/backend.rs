//! Backend trait for vault logical backends

use async_trait::async_trait;
use crate::errors::VaultResult;
use crate::logical::{Request, Response};

/// Trait for logical backends (secrets engines, auth methods, etc.)
#[async_trait]
pub trait Backend: Send + Sync {
    /// Handle a request
    async fn handle_request(&self, req: &mut Request) -> VaultResult<Option<Response>>;

    /// Initialize the backend
    async fn init(&self) -> VaultResult<()> {
        Ok(())
    }

    /// Cleanup the backend
    async fn cleanup(&self) -> VaultResult<()> {
        Ok(())
    }
}

