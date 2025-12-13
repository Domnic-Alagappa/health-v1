//! AES-GCM barrier implementation
//!
//! Adapted from RustyVault to use aes-gcm crate instead of OpenSSL

use std::sync::Arc;
use arc_swap::ArcSwap;
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, Zeroizing};
use sha2::{Sha256, Digest};
use async_trait::async_trait;
use crate::errors::{VaultError, VaultResult};
use crate::storage::{StorageBackend, SecurityBarrier, BARRIER_INIT_PATH};

const EPOCH_SIZE: usize = 4;
const KEY_EPOCH: u8 = 1;
const AES_GCM_VERSION1: u8 = 0x1;
const AES_GCM_VERSION2: u8 = 0x2;
const AES_BLOCK_SIZE: usize = 16;
const NONCE_SIZE: usize = 12; // GCM standard nonce size
const TAG_SIZE: usize = 16;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, Zeroize)]
#[serde(deny_unknown_fields)]
#[zeroize(drop)]
struct BarrierInit {
    version: u32,
    key: Vec<u8>,
}

#[derive(Debug, Clone, Zeroize)]
#[zeroize(drop)]
struct BarrierInfo {
    sealed: bool,
    key: Option<Zeroizing<Vec<u8>>>,
    aes_gcm_version_byte: u8,
}

impl Default for BarrierInfo {
    fn default() -> Self {
        Self {
            sealed: true,
            key: None,
            aes_gcm_version_byte: AES_GCM_VERSION2,
        }
    }
}

pub struct AESGCMBarrier {
    barrier_info: ArcSwap<BarrierInfo>,
    backend: Arc<dyn StorageBackend>,
}

impl AESGCMBarrier {
    pub fn new(backend: Arc<dyn StorageBackend>) -> Self {
        Self {
            backend,
            barrier_info: ArcSwap::from_pointee(BarrierInfo::default()),
        }
    }

    fn init_cipher(&self, key: &[u8]) -> VaultResult<()> {
        let mut barrier_info = (*self.barrier_info.load_full()).clone();
        barrier_info.key = Some(Zeroizing::new(key.to_vec()));
        self.barrier_info.store(Arc::new(barrier_info));
        Ok(())
    }

    fn reset_cipher(&self) -> VaultResult<()> {
        let mut barrier_info = (*self.barrier_info.load_full()).clone();
        if let Some(ref mut key) = barrier_info.key {
            key.zeroize();
        }
        barrier_info.key = None;
        self.barrier_info.store(Arc::new(barrier_info));
        Ok(())
    }

    fn encrypt(&self, _path: &str, plaintext: &[u8]) -> VaultResult<Vec<u8>> {
        let barrier_info = self.barrier_info.load();
        let key = barrier_info.key.as_ref()
            .ok_or_else(|| VaultError::Vault("Barrier not initialized".to_string()))?;

        // Create cipher
        let cipher = Aes256Gcm::new_from_slice(key.as_slice())
            .map_err(|e| VaultError::Vault(format!("Failed to create cipher: {}", e)))?;

        // Generate nonce
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);

        // Prepare output buffer: epoch(4) + version(1) + nonce(12) + ciphertext + tag(16)
        let mut out = vec![0u8; EPOCH_SIZE + 1 + NONCE_SIZE + plaintext.len() + TAG_SIZE];
        out[3] = KEY_EPOCH;
        out[4] = barrier_info.aes_gcm_version_byte;
        out[5..5 + NONCE_SIZE].copy_from_slice(nonce.as_slice());

        // Encrypt (AAD support can be added later if needed)
        let ciphertext = cipher.encrypt(&nonce, plaintext)
            .map_err(|e| VaultError::Vault(format!("Encryption failed: {}", e)))?;

        out[5 + NONCE_SIZE..5 + NONCE_SIZE + ciphertext.len()].copy_from_slice(&ciphertext);

        Ok(out)
    }

    fn decrypt(&self, _path: &str, ciphertext: &[u8]) -> VaultResult<Vec<u8>> {
        if ciphertext.len() < EPOCH_SIZE + 1 + NONCE_SIZE + TAG_SIZE {
            return Err(VaultError::Vault("Ciphertext too short".to_string()));
        }

        if ciphertext[0] != 0 || ciphertext[1] != 0 || ciphertext[2] != 0 || ciphertext[3] != KEY_EPOCH {
            return Err(VaultError::Vault("Epoch mismatch".to_string()));
        }

        let barrier_info = self.barrier_info.load();
        let key = barrier_info.key.as_ref()
            .ok_or_else(|| VaultError::Vault("Barrier not initialized".to_string()))?;

        let _version = ciphertext[4];
        let nonce = Nonce::from_slice(&ciphertext[5..5 + NONCE_SIZE]);
        let encrypted_data = &ciphertext[5 + NONCE_SIZE..];

        // Create cipher
        let cipher = Aes256Gcm::new_from_slice(key.as_slice())
            .map_err(|e| VaultError::Vault(format!("Failed to create cipher: {}", e)))?;

        // Decrypt (AAD support can be added later if needed)
        let plaintext = cipher.decrypt(nonce, encrypted_data)
            .map_err(|_| VaultError::Vault("Decryption failed".to_string()))?;

        Ok(plaintext)
    }
}

#[async_trait]
impl SecurityBarrier for AESGCMBarrier {
    async fn inited(&self) -> VaultResult<bool> {
        let res = self.backend.get(BARRIER_INIT_PATH).await?;
        Ok(res.is_some())
    }

    async fn init(&self, kek: &[u8]) -> VaultResult<()> {
        let (min, max) = self.key_length_range();
        if kek.len() < min || kek.len() > max {
            return Err(VaultError::Vault("Invalid key length".to_string()));
        }

        // Check if already initialized
        let inited = self.inited().await?;
        if inited {
            return Err(VaultError::Vault("Barrier already initialized".to_string()));
        }

        // Generate encryption key
        let encrypt_key = self.generate_key()?;

        let barrier_init = BarrierInit {
            version: 1,
            key: encrypt_key.to_vec(),
        };

        let serialized_barrier_init = serde_json::to_string(&barrier_init)
            .map_err(|e| VaultError::Serialization(e))?;

        // Use KEK to encrypt the barrier init
        self.init_cipher(kek)?;
        let value = self.encrypt(BARRIER_INIT_PATH, serialized_barrier_init.as_bytes())?;
        self.backend.put(BARRIER_INIT_PATH, &value).await?;
        self.reset_cipher()?;

        Ok(())
    }

    fn generate_key(&self) -> VaultResult<Zeroizing<Vec<u8>>> {
        let key_size = 2 * AES_BLOCK_SIZE; // 32 bytes for AES-256
        let mut buf = Zeroizing::new(vec![0u8; key_size]);
        use rand::RngCore;
        rand::thread_rng().fill_bytes(buf.as_mut_slice());
        Ok(buf)
    }

    fn key_length_range(&self) -> (usize, usize) {
        (AES_BLOCK_SIZE, 2 * AES_BLOCK_SIZE)
    }

    fn sealed(&self) -> VaultResult<bool> {
        Ok(self.barrier_info.load().sealed)
    }

    async fn unseal(&self, kek: &[u8]) -> VaultResult<()> {
        let sealed = self.sealed()?;
        if !sealed {
            return Ok(());
        }

        let entry = self.backend.get(BARRIER_INIT_PATH).await?;
        let entry = entry.ok_or_else(|| VaultError::Vault("Barrier not initialized".to_string()))?;

        // Decrypt with KEK
        self.init_cipher(kek)?;
        let value = self.decrypt(BARRIER_INIT_PATH, &entry)?;
        self.reset_cipher()?;

        let barrier_init: BarrierInit = serde_json::from_slice(&value)
            .map_err(|e| VaultError::Serialization(e))?;

        // Use the real encryption key
        self.init_cipher(barrier_init.key.as_slice())?;

        let mut barrier_info = (*self.barrier_info.load_full()).clone();
        barrier_info.sealed = false;
        self.barrier_info.store(Arc::new(barrier_info));

        Ok(())
    }

    fn seal(&self) -> VaultResult<()> {
        self.reset_cipher()?;
        let mut barrier_info = (*self.barrier_info.load_full()).clone();
        barrier_info.sealed = true;
        self.barrier_info.store(Arc::new(barrier_info));
        Ok(())
    }

    fn derive_hmac_key(&self) -> VaultResult<Vec<u8>> {
        let barrier_info = self.barrier_info.load();
        let key = barrier_info.key.as_ref()
            .ok_or_else(|| VaultError::Vault("Barrier not initialized".to_string()))?;

        if self.sealed()? {
            return Err(VaultError::Vault("Barrier is sealed".to_string()));
        }

        let mut hasher = Sha256::new();
        hasher.update(key.as_slice());
        Ok(hasher.finalize().to_vec())
    }
}

#[async_trait]
impl StorageBackend for AESGCMBarrier {
    async fn get(&self, key: &str) -> VaultResult<Option<Vec<u8>>> {
        if self.sealed()? {
            return Err(VaultError::Vault("Barrier is sealed".to_string()));
        }

        let encrypted = self.backend.get(key).await?;
        if encrypted.is_none() {
            return Ok(None);
        }

        let plaintext = self.decrypt(key, encrypted.as_ref().unwrap())?;
        Ok(Some(plaintext))
    }

    async fn put(&self, key: &str, value: &[u8]) -> VaultResult<()> {
        if self.sealed()? {
            return Err(VaultError::Vault("Barrier is sealed".to_string()));
        }

        let ciphertext = self.encrypt(key, value)?;
        self.backend.put(key, &ciphertext).await?;
        Ok(())
    }

    async fn delete(&self, key: &str) -> VaultResult<()> {
        if self.sealed()? {
            return Err(VaultError::Vault("Barrier is sealed".to_string()));
        }
        self.backend.delete(key).await
    }

    async fn list(&self, prefix: &str) -> VaultResult<Vec<String>> {
        if self.sealed()? {
            return Err(VaultError::Vault("Barrier is sealed".to_string()));
        }
        let mut keys = self.backend.list(prefix).await?;
        keys.sort();
        Ok(keys)
    }
}

