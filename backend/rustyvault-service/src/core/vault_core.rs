//! Vault core implementation
//!
//! Adapted from RustyVault's Core to integrate with health-v1 infrastructure

use std::sync::Arc;
use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, Zeroizing};
use crate::errors::{VaultError, VaultResult};
use crate::logical::{Request, Response};
use crate::storage::{StorageBackend, SecurityBarrier, barrier_aes_gcm::AESGCMBarrier};
use crate::shamir::{ShamirSecret, SHAMIR_OVERHEAD};
use crate::router::Router;

const SEAL_CONFIG_PATH: &str = "core/seal-config";

/// Seal configuration
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SealConfig {
    pub secret_shares: u8,
    pub secret_threshold: u8,
}

impl SealConfig {
    pub fn validate(&self) -> VaultResult<()> {
        if self.secret_threshold > self.secret_shares {
            return Err(VaultError::Vault("Invalid seal config: threshold > shares".to_string()));
        }
        Ok(())
    }
}

/// Initialization result
#[derive(Debug, Clone, PartialEq, Zeroize)]
#[zeroize(drop)]
pub struct InitResult {
    pub secret_shares: Zeroizing<Vec<Vec<u8>>>,
    pub root_token: String,
}

/// Core state
#[derive(Clone, Zeroize)]
#[zeroize(drop)]
pub struct CoreState {
    pub sealed: bool,
    pub hmac_key: Vec<u8>,
    unseal_key_shares: Vec<Vec<u8>>,
    kek: Vec<u8>,
}

impl Default for CoreState {
    fn default() -> Self {
        Self {
            sealed: true,
            unseal_key_shares: Vec::new(),
            hmac_key: Vec::new(),
            kek: Vec::new(),
        }
    }
}

/// Vault core
pub struct VaultCore {
    pub storage: Arc<dyn StorageBackend>,
    pub barrier: Arc<AESGCMBarrier>,
    pub router: Arc<Router>,
    pub state: Arc<std::sync::Mutex<CoreState>>,
}

impl VaultCore {
    pub fn new(storage: Arc<dyn StorageBackend>) -> Self {
        let barrier = Arc::new(AESGCMBarrier::new(storage.clone()));
        Self {
            storage,
            barrier,
            router: Arc::new(Router::new()),
            state: Arc::new(std::sync::Mutex::new(CoreState::default())),
        }
    }

    pub async fn init(&self, seal_config: &SealConfig) -> VaultResult<InitResult> {
        seal_config.validate()?;
        
        let inited = self.inited().await?;
        if inited {
            return Err(VaultError::Vault("Vault already initialized".to_string()));
        }

        // Store seal config
        let serialized = serde_json::to_string(seal_config)
            .map_err(|e| VaultError::Serialization(e))?;
        self.storage.put(SEAL_CONFIG_PATH, serialized.as_bytes()).await?;

        // Generate KEK and initialize barrier
        let kek = self.barrier.generate_key()?;
        self.barrier.init(kek.as_slice()).await?;
        self.barrier.unseal(kek.as_slice()).await?;

        // Generate unseal keys
        let secret_shares = if seal_config.secret_shares == 1 {
            Zeroizing::new(vec![kek.as_slice().to_vec()])
        } else {
            ShamirSecret::split(kek.as_slice(), seal_config.secret_shares, seal_config.secret_threshold)?
        };

        // Update state
        let mut state = self.state.lock().unwrap();
        state.hmac_key = self.barrier.derive_hmac_key()?;
        state.sealed = false;
        state.kek = kek.as_slice().to_vec();
        drop(state);

        // Generate root token (simplified - in real implementation would use auth module)
        let root_token = uuid::Uuid::new_v4().to_string();

        // Re-seal for security
        self.barrier.seal()?;
        let mut state = self.state.lock().unwrap();
        state.sealed = true;
        drop(state);

        Ok(InitResult {
            secret_shares,
            root_token,
        })
    }

    pub async fn inited(&self) -> VaultResult<bool> {
        self.barrier.inited().await
    }

    pub async fn unseal(&self, key: &[u8]) -> VaultResult<bool> {
        let inited = self.inited().await?;
        if !inited {
            return Err(VaultError::Vault("Vault not initialized".to_string()));
        }

        let sealed = self.barrier.sealed()?;
        if !sealed {
            return Err(VaultError::Vault("Vault already unsealed".to_string()));
        }

        // Get seal config - this is the await before we acquire the lock
        let config_data = self.storage.get(SEAL_CONFIG_PATH).await?
            .ok_or_else(|| VaultError::Vault("Seal config not found".to_string()))?;
        let seal_config: SealConfig = serde_json::from_slice(&config_data)
            .map_err(|e| VaultError::Serialization(e))?;

        let (min, mut max) = self.barrier.key_length_range();
        max += SHAMIR_OVERHEAD;
        if key.len() < min || key.len() > max {
            return Err(VaultError::Vault("Invalid key length".to_string()));
        }

        // Process unseal key and get KEK - all in a block so lock is dropped before await
        let kek: Option<Zeroizing<Vec<u8>>> = {
            let mut state = self.state.lock().unwrap();
            
            // Check for duplicate key
            if state.unseal_key_shares.iter().any(|v| *v == key) {
                None // Will return Ok(false) below
            } else {
                state.unseal_key_shares.push(key.to_vec());

                if state.unseal_key_shares.len() < seal_config.secret_threshold as usize {
                    None // Not enough keys yet, will return Ok(false) below
                } else {
                    // Combine keys using Shamir
                    let key_shares = state.unseal_key_shares.clone();
                    let result = if seal_config.secret_threshold == 1 {
                        Some(Zeroizing::new(key_shares[0].clone()))
                    } else if let Some(res) = ShamirSecret::combine(key_shares) {
                        Some(Zeroizing::new(res))
                    } else {
                        state.unseal_key_shares.clear();
                        return Err(VaultError::Vault("Failed to combine keys".to_string()));
                    };
                    result
                }
            }
            // Lock is dropped here at end of block
        };

        // If we don't have enough keys yet, return false
        let kek = match kek {
            Some(k) => k,
            None => return Ok(false),
        };

        // Now we can await - lock is not held
        self.barrier.unseal(kek.as_slice()).await?;

        // Re-acquire lock to update state
        {
            let mut state = self.state.lock().unwrap();
            state.hmac_key = self.barrier.derive_hmac_key()?;
            state.sealed = false;
            state.kek = kek.as_slice().to_vec();
            state.unseal_key_shares.clear();
        }

        Ok(true)
    }

    pub async fn seal(&self) -> VaultResult<()> {
        self.barrier.seal()?;
        let mut state = self.state.lock().unwrap();
        state.sealed = true;
        state.kek.clear();
        state.hmac_key.clear();
        state.unseal_key_shares.clear();
        Ok(())
    }

    pub async fn handle_request(&self, req: &mut Request) -> VaultResult<Option<Response>> {
        if self.is_sealed() {
            return Err(VaultError::Vault("Vault is sealed".to_string()));
        }
        self.router.route(req).await
    }

    pub fn is_sealed(&self) -> bool {
        let state = self.state.lock().unwrap();
        state.sealed
    }

    pub fn seal_config(&self) -> VaultResult<SealConfig> {
        // This would need to be async in real implementation
        // For now, return a default
        Ok(SealConfig {
            secret_shares: 5,
            secret_threshold: 3,
        })
    }
}

