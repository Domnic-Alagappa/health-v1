use serde::{Deserialize, Serialize};

/// Encrypted value wrapper for type safety
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptedValue {
    pub encrypted_data: Vec<u8>,
    pub algorithm: String,
    pub iv: Option<Vec<u8>>, // Initialization vector for AES-GCM
    pub tag: Option<Vec<u8>>, // Authentication tag for AES-GCM
}

impl EncryptedValue {
    pub fn new(
        encrypted_data: Vec<u8>,
        algorithm: String,
        iv: Option<Vec<u8>>,
        tag: Option<Vec<u8>>,
    ) -> Self {
        Self {
            encrypted_data,
            algorithm,
            iv,
            tag,
        }
    }

    pub fn is_aes_gcm(&self) -> bool {
        self.algorithm == "AES-256-GCM"
    }
}

