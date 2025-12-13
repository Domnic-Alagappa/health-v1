//! Request router for vault operations

use std::sync::Arc;
use std::sync::Mutex;
use radix_trie::{Trie, TrieCommon};
use crate::errors::VaultResult;
use crate::logical::{Request, Response, Backend};

/// Router for vault requests
pub struct Router {
    backends: Arc<Mutex<Trie<String, Arc<dyn Backend>>>>,
}

impl Router {
    pub fn new() -> Self {
        Self {
            backends: Arc::new(Mutex::new(Trie::new())),
        }
    }

    pub fn add_backend(&self, path: String, backend: Arc<dyn Backend>) {
        let mut backends = self.backends.lock().unwrap();
        backends.insert(path, backend);
    }

    pub async fn route(&self, req: &mut Request) -> VaultResult<Option<Response>> {
        // Find the backend in a block so the lock is dropped before any await
        let best_match: Option<Arc<dyn Backend>> = {
            let backends = self.backends.lock().unwrap();
            
            // Find the longest matching backend path
            let mut best_match: Option<Arc<dyn Backend>> = None;
            let mut best_len = 0;
            
            // Iterate through the trie to find matching paths
            for (path, backend) in backends.iter() {
                if req.path.starts_with(path) && path.len() > best_len {
                    best_len = path.len();
                    best_match = Some(backend.clone());
                }
            }
            
            best_match
            // Lock is dropped here at end of block
        };
        
        // Now we can await - lock is not held
        if let Some(backend) = best_match {
            backend.handle_request(req).await
        } else {
            // Default: no backend found for this path
            Ok(None)
        }
    }
}

impl Default for Router {
    fn default() -> Self {
        Self::new()
    }
}

