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
        
        self.client
            .post(&path)
            .header("X-Vault-Token", &self.token)
            .json(&data)
            .send()
            .await
            .map_err(|e| crate::shared::AppError::Encryption(format!("Vault request error: {}", e)))?;
        
        Ok(())
    }

    async fn get_dek(&self, entity_id: &str, entity_type: &str) -> AppResult<Option<Vec<u8>>> {
        let path = format!("{}/v1/{}/data/{}/{}", self.addr, self.mount_path, entity_type, entity_id);
        
        let response = self.client
            .get(&path)
            .header("X-Vault-Token", &self.token)
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
        
        self.client
            .delete(&path)
            .header("X-Vault-Token", &self.token)
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
}

