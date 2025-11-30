use crate::infrastructure::storage::storage_trait::Storage;
use crate::shared::AppResult;
use async_trait::async_trait;
use std::path::PathBuf;
use tokio::fs;

pub struct LocalFsStorage {
    base_path: PathBuf,
}

impl LocalFsStorage {
    pub fn new(path: &str) -> Self {
        Self {
            base_path: PathBuf::from(path),
        }
    }

    fn get_path(&self, key: &str) -> PathBuf {
        self.base_path.join(key)
    }
}

#[async_trait]
impl Storage for LocalFsStorage {
    async fn put(&self, key: &str, data: &[u8]) -> AppResult<()> {
        let path = self.get_path(key);
        
        // Create parent directories if needed
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).await
                .map_err(|e| crate::shared::AppError::Storage(format!("Failed to create directory: {}", e)))?;
        }

        fs::write(&path, data).await
            .map_err(|e| crate::shared::AppError::Storage(format!("Failed to write file: {}", e)))?;
        
        Ok(())
    }

    async fn get(&self, key: &str) -> AppResult<Option<Vec<u8>>> {
        let path = self.get_path(key);
        
        match fs::read(&path).await {
            Ok(data) => Ok(Some(data)),
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
            Err(e) => Err(crate::shared::AppError::Storage(format!("Failed to read file: {}", e))),
        }
    }

    async fn delete(&self, key: &str) -> AppResult<()> {
        let path = self.get_path(key);
        fs::remove_file(&path).await
            .map_err(|e| crate::shared::AppError::Storage(format!("Failed to delete file: {}", e)))?;
        Ok(())
    }

    async fn list(&self, prefix: &str) -> AppResult<Vec<String>> {
        let prefix_path = self.get_path(prefix);
        let mut keys = Vec::new();

        if prefix_path.is_dir() {
            let mut entries = fs::read_dir(&prefix_path).await
                .map_err(|e| crate::shared::AppError::Storage(format!("Failed to read directory: {}", e)))?;

            while let Some(entry) = entries.next_entry().await
                .map_err(|e| crate::shared::AppError::Storage(format!("Failed to read entry: {}", e)))? {
                if let Some(file_name) = entry.file_name().to_str() {
                    keys.push(format!("{}/{}", prefix, file_name));
                }
            }
        }

        Ok(keys)
    }
}

