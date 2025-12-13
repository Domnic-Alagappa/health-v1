//! KV (Key-Value) secrets engine module
//!
//! KV2 implementation for versioned key-value storage

use std::sync::Arc;
use async_trait::async_trait;
use serde_json::{Map, Value};
use crate::errors::VaultResult;
use crate::logical::{Backend, Request, Response, Operation};
use crate::storage::StorageBackend;

/// KV secrets engine backend
pub struct KvBackend {
    storage: Arc<dyn StorageBackend>,
    mount_path: String,
}

impl KvBackend {
    pub fn new(storage: Arc<dyn StorageBackend>, mount_path: String) -> Self {
        Self {
            storage,
            mount_path,
        }
    }

    fn storage_path(&self, key: &str) -> String {
        format!("{}/data/{}", self.mount_path, key)
    }

    fn metadata_path(&self, key: &str) -> String {
        format!("{}/metadata/{}", self.mount_path, key)
    }

    async fn read_secret(&self, key: &str) -> VaultResult<Option<Response>> {
        let data_path = self.storage_path(key);
        let data = self.storage.get(&data_path).await?;
        
        if data.is_none() {
            return Ok(None);
        }

        let value: Map<String, Value> = serde_json::from_slice(&data.unwrap())
            .map_err(|e| crate::errors::VaultError::Serialization(e))?;

        Ok(Some(Response::new().data(value)))
    }

    async fn write_secret(&self, key: &str, data: Map<String, Value>) -> VaultResult<Option<Response>> {
        let data_path = self.storage_path(key);
        let metadata_path = self.metadata_path(key);

        // Get existing version
        let version = if let Some(meta_data) = self.storage.get(&metadata_path).await? {
            let meta: Map<String, Value> = serde_json::from_slice(&meta_data)
                .map_err(|e| crate::errors::VaultError::Serialization(e))?;
            meta.get("current_version")
                .and_then(|v| v.as_u64())
                .unwrap_or(0) + 1
        } else {
            1
        };

        // Store data with version
        let mut versioned_data = Map::new();
        versioned_data.insert("data".to_string(), Value::Object(data.clone()));
        versioned_data.insert("version".to_string(), Value::Number(version.into()));

        let data_json = serde_json::to_vec(&versioned_data)
            .map_err(|e| crate::errors::VaultError::Serialization(e))?;
        self.storage.put(&data_path, &data_json).await?;

        // Update metadata
        let mut metadata = Map::new();
        metadata.insert("current_version".to_string(), Value::Number(version.into()));
        metadata.insert("created_time".to_string(), Value::String(chrono::Utc::now().to_rfc3339()));
        
        let meta_json = serde_json::to_vec(&metadata)
            .map_err(|e| crate::errors::VaultError::Serialization(e))?;
        self.storage.put(&metadata_path, &meta_json).await?;

        Ok(Some(Response::new().data(data)))
    }

    async fn delete_secret(&self, key: &str) -> VaultResult<Option<Response>> {
        let metadata_path = self.metadata_path(key);

        // Mark as deleted in metadata instead of actually deleting
        if let Some(meta_data) = self.storage.get(&metadata_path).await? {
            let mut meta: Map<String, Value> = serde_json::from_slice(&meta_data)
                .map_err(|e| crate::errors::VaultError::Serialization(e))?;
            meta.insert("deleted".to_string(), Value::Bool(true));
            meta.insert("deletion_time".to_string(), Value::String(chrono::Utc::now().to_rfc3339()));
            
            let meta_json = serde_json::to_vec(&meta)
                .map_err(|e| crate::errors::VaultError::Serialization(e))?;
            self.storage.put(&metadata_path, &meta_json).await?;
        }

        Ok(None)
    }

    async fn list_secrets(&self, prefix: &str) -> VaultResult<Option<Response>> {
        let list_path = format!("{}/data/{}", self.mount_path, prefix);
        let keys = self.storage.list(&list_path).await?;
        
        // Extract just the key names
        let key_names: Vec<String> = keys.iter()
            .map(|k| {
                k.strip_prefix(&format!("{}/data/", self.mount_path))
                    .unwrap_or(k)
                    .to_string()
            })
            .collect();

        let mut data = Map::new();
        data.insert("keys".to_string(), Value::Array(
            key_names.iter().map(|k| Value::String(k.clone())).collect()
        ));

        Ok(Some(Response::new().data(data)))
    }
}

#[async_trait]
impl Backend for KvBackend {
    async fn handle_request(&self, req: &mut Request) -> VaultResult<Option<Response>> {
        // Remove mount path from request path
        let key = req.path.strip_prefix(&format!("{}/", self.mount_path))
            .unwrap_or(&req.path)
            .to_string();

        match req.operation {
            Operation::Read => self.read_secret(&key).await,
            Operation::Write => {
                let data = req.data.take();
                self.write_secret(&key, data.unwrap_or_default()).await
            }
            Operation::Delete => self.delete_secret(&key).await,
            Operation::List => self.list_secrets(&key).await,
        }
    }
}

