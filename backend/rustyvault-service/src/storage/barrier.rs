//! Security barrier trait

use async_trait::async_trait;
use zeroize::Zeroizing;
use crate::errors::VaultResult;
// StorageBackend is used in trait methods but not directly in this file

pub const BARRIER_INIT_PATH: &str = "barrier/init";

/// Security barrier trait for encrypting/decrypting data
#[async_trait]
pub trait SecurityBarrier: Send + Sync {
    async fn inited(&self) -> VaultResult<bool>;
    async fn init(&self, key: &[u8]) -> VaultResult<()>;
    fn generate_key(&self) -> VaultResult<Zeroizing<Vec<u8>>>;
    fn key_length_range(&self) -> (usize, usize);
    fn sealed(&self) -> VaultResult<bool>;
    async fn unseal(&self, key: &[u8]) -> VaultResult<()>;
    fn seal(&self) -> VaultResult<()>;
    fn derive_hmac_key(&self) -> VaultResult<Vec<u8>>;
}

