use crate::infrastructure::encryption::vault::Vault;
use crate::shared::AppResult;
use async_trait::async_trait;
use base64::{Engine as _, engine::general_purpose::STANDARD};
use reqwest::Client;

pub struct HashiCorpVault {
    client: Client,
    addr: String,
    token: String,
    mount_path: String,
}

impl HashiCorpVault {
    pub fn new(addr: &str, token: &str, mount_path: &str) -> Self {
        Self {
            client: Client::new(),
            addr: addr.to_string(),
            token: token.to_string(),
            mount_path: mount_path.to_string(),
        }
    }
}

#[async_trait]
impl Vault for HashiCorpVault {
    async fn store_dek(&self, entity_id: &str, entity_type: &str, encrypted_dek: &[u8]) -> AppResult<()> {
        let path = format!("{}/v1/{}/data/{}/{}", self.addr, self.mount_path, entity_type, entity_id);
        let data = serde_json::json!({
            "data": {
                "encrypted_dek": STANDARD.encode(encrypted_dek)
            }
        });
        
        let mut request = self.client
            .post(&path)
            .header("X-Vault-Token", &self.token);
        
        // Only add namespace header if VAULT_NAMESPACE is set (for enterprise/namespaced setups)
        // In dev mode, OpenBao doesn't use namespaces
        if let Ok(namespace) = std::env::var("VAULT_NAMESPACE") {
            if !namespace.is_empty() {
                request = request.header("X-Vault-Namespace", &namespace);
            }
        }
        
        request
            .json(&data)
            .send()
            .await
            .map_err(|e| crate::shared::AppError::Encryption(format!("Vault request error: {}", e)))?;
        
        Ok(())
    }

    async fn get_dek(&self, entity_id: &str, entity_type: &str) -> AppResult<Option<Vec<u8>>> {
        let path = format!("{}/v1/{}/data/{}/{}", self.addr, self.mount_path, entity_type, entity_id);
        
        let mut request = self.client
            .get(&path)
            .header("X-Vault-Token", &self.token);
        
        // Only add namespace header if VAULT_NAMESPACE is set
        if let Ok(namespace) = std::env::var("VAULT_NAMESPACE") {
            if !namespace.is_empty() {
                request = request.header("X-Vault-Namespace", &namespace);
            }
        }
        
        let response = request
            .send()
            .await
            .map_err(|e| crate::shared::AppError::Encryption(format!("Vault request error: {}", e)))?;

        if response.status().is_success() {
            let json: serde_json::Value = response.json().await
                .map_err(|e| crate::shared::AppError::Encryption(format!("Vault response parse error: {}", e)))?;
            
            if let Some(encrypted_dek_str) = json
                .get("data")
                .and_then(|d| d.get("data"))
                .and_then(|d| d.get("encrypted_dek"))
                .and_then(|v| v.as_str())
            {
                let dek = STANDARD.decode(encrypted_dek_str)
                    .map_err(|e| crate::shared::AppError::Encryption(format!("Base64 decode error: {}", e)))?;
                Ok(Some(dek))
            } else {
                Ok(None)
            }
        } else {
            Ok(None)
        }
    }

    async fn delete_dek(&self, entity_id: &str, entity_type: &str) -> AppResult<()> {
        let path = format!("{}/v1/{}/data/{}/{}", self.addr, self.mount_path, entity_type, entity_id);
        
        let mut request = self.client
            .delete(&path)
            .header("X-Vault-Token", &self.token);
        
        // Only add namespace header if VAULT_NAMESPACE is set
        if let Ok(namespace) = std::env::var("VAULT_NAMESPACE") {
            if !namespace.is_empty() {
                request = request.header("X-Vault-Namespace", &namespace);
            }
        }
        
        request
            .send()
            .await
            .map_err(|e| crate::shared::AppError::Encryption(format!("Vault delete error: {}", e)))?;
        
        Ok(())
    }

    async fn rotate_master_key(&self, _new_master_key: &[u8]) -> AppResult<()> {
        // Implementation would re-encrypt all DEKs with new master key
        // This is a complex operation that requires listing all keys
        Err(crate::shared::AppError::Encryption(
            "Master key rotation not yet implemented".to_string(),
        ))
    }

    async fn store_master_key(&self, master_key: &[u8]) -> AppResult<()> {
        // Store master key at a special path: {mount_path}/data/master_key
        let path = format!("{}/v1/{}/data/master_key", self.addr, self.mount_path);
        let data = serde_json::json!({
            "data": {
                "master_key": STANDARD.encode(master_key)
            }
        });
        
        let mut request = self.client
            .post(&path)
            .header("X-Vault-Token", &self.token);
        
        // Only add namespace header if VAULT_NAMESPACE is set
        if let Ok(namespace) = std::env::var("VAULT_NAMESPACE") {
            if !namespace.is_empty() {
                request = request.header("X-Vault-Namespace", &namespace);
            }
        }
        
        let response = request
            .json(&data)
            .send()
            .await
            .map_err(|e| crate::shared::AppError::Encryption(format!("Vault request error: {}", e)))?;
        
        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            return Err(crate::shared::AppError::Encryption(
                format!("Failed to store master key in vault: {} - {}", status, error_text)
            ));
        }
        
        Ok(())
    }

    async fn get_master_key(&self) -> AppResult<Option<Vec<u8>>> {
        // Retrieve master key from special path: {mount_path}/data/master_key
        let path = format!("{}/v1/{}/data/master_key", self.addr, self.mount_path);
        
        let mut request = self.client
            .get(&path)
            .header("X-Vault-Token", &self.token);
        
        // Only add namespace header if VAULT_NAMESPACE is set
        if let Ok(namespace) = std::env::var("VAULT_NAMESPACE") {
            if !namespace.is_empty() {
                request = request.header("X-Vault-Namespace", &namespace);
            }
        }
        
        let response = request
            .send()
            .await
            .map_err(|e| crate::shared::AppError::Encryption(format!("Vault request error: {}", e)))?;

        if response.status().is_success() {
            let json: serde_json::Value = response.json().await
                .map_err(|e| crate::shared::AppError::Encryption(format!("Vault response parse error: {}", e)))?;
            
            if let Some(master_key_str) = json
                .get("data")
                .and_then(|d| d.get("data"))
                .and_then(|d| d.get("master_key"))
                .and_then(|v| v.as_str())
            {
                let master_key = STANDARD.decode(master_key_str)
                    .map_err(|e| crate::shared::AppError::Encryption(format!("Base64 decode error: {}", e)))?;
                Ok(Some(master_key))
            } else {
                Ok(None)
            }
        } else if response.status() == 404 {
            // Master key doesn't exist yet (first-time setup)
            Ok(None)
        } else {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            Err(crate::shared::AppError::Encryption(
                format!("Failed to retrieve master key from vault: {} - {}", status, error_text)
            ))
        }
    }
}

