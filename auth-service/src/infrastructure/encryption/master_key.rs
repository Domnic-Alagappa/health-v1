use crate::shared::AppResult;
use std::fs;
use std::path::Path;

pub struct MasterKey {
    key: Vec<u8>,
}

impl MasterKey {
    /// Load master key from file
    pub fn from_file(path: &Path) -> AppResult<Self> {
        let key = fs::read(path)
            .map_err(|e| crate::shared::AppError::Encryption(format!("Failed to read master key: {}", e)))?;
        Ok(Self { key })
    }

    /// Load master key from environment variable
    pub fn from_env(env_var: &str) -> AppResult<Self> {
        let key_str = std::env::var(env_var)
            .map_err(|_| crate::shared::AppError::Encryption("Master key not found in environment".to_string()))?;
        let key = hex::decode(&key_str)
            .map_err(|e| crate::shared::AppError::Encryption(format!("Invalid master key format: {}", e)))?;
        Ok(Self { key })
    }

    /// Generate a new master key (for initial setup)
    pub fn generate() -> AppResult<Self> {
        use ring::rand::{SecureRandom, SystemRandom};
        let rng = SystemRandom::new();
        let mut key = vec![0u8; 32]; // 256-bit key
        rng.fill(&mut key)
            .map_err(|e| crate::shared::AppError::Encryption(format!("Failed to generate random key: {}", e)))?;
        Ok(Self { key })
    }

    pub fn key(&self) -> &[u8] {
        &self.key
    }

    /// Save master key to file (use with caution!)
    pub fn save_to_file(&self, path: &Path) -> AppResult<()> {
        fs::write(path, &self.key)
            .map_err(|e| crate::shared::AppError::Encryption(format!("Failed to write master key: {}", e)))?;
        Ok(())
    }
}

