//! Response structure for vault operations

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

/// Authentication information in response
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ResponseAuth {
    #[serde(default)]
    pub client_token: String,
    #[serde(default)]
    pub accessor: String,
    #[serde(default)]
    pub policies: Vec<String>,
    #[serde(default)]
    pub token_ttl: i64,
    #[serde(default)]
    pub renewable: bool,
    #[serde(default)]
    pub metadata: Map<String, Value>,
    #[serde(default)]
    pub lease_duration: u64,
}

/// Alias for backwards compatibility
pub type Auth = ResponseAuth;

/// Logical response for vault operations
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Response {
    pub data: Option<Map<String, Value>>,
    pub auth: Option<Auth>,
    pub warnings: Vec<String>,
    pub wrap_info: Option<Map<String, Value>>,
    pub redirect: Option<String>,
}

impl Response {
    pub fn new() -> Self {
        Self {
            data: None,
            auth: None,
            warnings: Vec::new(),
            wrap_info: None,
            redirect: None,
        }
    }

    pub fn data(mut self, data: Map<String, Value>) -> Self {
        self.data = Some(data);
        self
    }

    pub fn auth(mut self, auth: Auth) -> Self {
        self.auth = Some(auth);
        self
    }
}

impl Default for Response {
    fn default() -> Self {
        Self::new()
    }
}

