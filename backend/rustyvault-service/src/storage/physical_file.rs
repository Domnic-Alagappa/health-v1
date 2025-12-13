//! File-based physical storage backend

use std::{
    fs::{self, File},
    io::{self, Read, Write},
    path::PathBuf,
};
use async_trait::async_trait;
use crate::errors::{VaultError, VaultResult};
use crate::storage::StorageBackend;

pub struct FileBackend {
    path: PathBuf,
}

impl FileBackend {
    pub fn new(path: impl Into<PathBuf>) -> VaultResult<Self> {
        let path: PathBuf = path.into();
        fs::create_dir_all(&path)
            .map_err(|e| VaultError::Io(e))?;
        Ok(Self { path })
    }

    fn path_key(&self, key: &str) -> (PathBuf, String) {
        let parts: Vec<&str> = key.split('/').collect();
        let file_name = parts.last().unwrap_or(&key).to_string();
        let dir_path = if parts.len() > 1 {
            self.path.join(parts[..parts.len() - 1].join("/"))
        } else {
            self.path.clone()
        };
        (dir_path, file_name)
    }
}

#[async_trait]
impl StorageBackend for FileBackend {
    async fn get(&self, key: &str) -> VaultResult<Option<Vec<u8>>> {
        if key.starts_with('/') {
            return Err(VaultError::Storage("Key cannot start with /".to_string()));
        }

        let (dir_path, file_name) = self.path_key(key);
        let file_path = dir_path.join(&file_name);

        match File::open(&file_path) {
            Ok(mut file) => {
                let mut buffer = Vec::new();
                file.read_to_end(&mut buffer)
                    .map_err(|e| VaultError::Io(e))?;
                Ok(Some(buffer))
            }
            Err(err) => {
                if err.kind() == io::ErrorKind::NotFound {
                    Ok(None)
                } else {
                    Err(VaultError::Io(err))
                }
            }
        }
    }

    async fn put(&self, key: &str, value: &[u8]) -> VaultResult<()> {
        if key.starts_with('/') {
            return Err(VaultError::Storage("Key cannot start with /".to_string()));
        }

        let (dir_path, file_name) = self.path_key(key);
        fs::create_dir_all(&dir_path)
            .map_err(|e| VaultError::Io(e))?;

        let file_path = dir_path.join(&file_name);
        let mut file = File::create(&file_path)
            .map_err(|e| VaultError::Io(e))?;
        file.write_all(value)
            .map_err(|e| VaultError::Io(e))?;
        Ok(())
    }

    async fn delete(&self, key: &str) -> VaultResult<()> {
        if key.starts_with('/') {
            return Err(VaultError::Storage("Key cannot start with /".to_string()));
        }

        let (dir_path, file_name) = self.path_key(key);
        let file_path = dir_path.join(&file_name);

        if file_path.exists() {
            fs::remove_file(&file_path)
                .map_err(|e| VaultError::Io(e))?;
        }
        Ok(())
    }

    async fn list(&self, prefix: &str) -> VaultResult<Vec<String>> {
        if prefix.starts_with('/') {
            return Err(VaultError::Storage("Prefix cannot start with /".to_string()));
        }

        let mut path = self.path.clone();
        if !prefix.is_empty() {
            path.push(prefix);
        }

        if !path.exists() {
            return Ok(Vec::new());
        }

        let mut names: Vec<String> = vec![];
        let entries = fs::read_dir(&path)
            .map_err(|e| VaultError::Io(e))?;
        
        for entry in entries {
            let entry = entry.map_err(|e| VaultError::Io(e))?;
            let name = entry.file_name().to_string_lossy().into_owned();
            if prefix.is_empty() {
                names.push(name);
            } else {
                names.push(format!("{}/{}", prefix, name));
            }
        }
        Ok(names)
    }
}

