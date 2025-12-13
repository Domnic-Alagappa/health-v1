//! Request structure for vault operations

use serde_json::{Map, Value};
use std::collections::HashMap;

/// Logical request for vault operations
#[derive(Debug, Clone, Default)]
pub struct Request {
    pub id: String,
    pub operation: Operation,
    pub path: String,
    pub client_token: String,
    pub data: Option<Map<String, Value>>,
    pub headers: HashMap<String, String>,
}

impl Default for Operation {
    fn default() -> Self {
        Operation::Read
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Operation {
    Read,
    Write,
    Delete,
    List,
}

impl From<&str> for Operation {
    fn from(s: &str) -> Self {
        match s.to_uppercase().as_str() {
            "GET" | "READ" => Operation::Read,
            "POST" | "PUT" | "WRITE" => Operation::Write,
            "DELETE" => Operation::Delete,
            "LIST" => Operation::List,
            _ => Operation::Read,
        }
    }
}

impl Request {
    pub fn new_read_request(path: impl Into<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            operation: Operation::Read,
            path: path.into(),
            client_token: String::new(),
            data: None,
            headers: HashMap::new(),
        }
    }

    pub fn new_write_request(path: impl Into<String>, data: Option<Map<String, Value>>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            operation: Operation::Write,
            path: path.into(),
            client_token: String::new(),
            data,
            headers: HashMap::new(),
        }
    }

    pub fn new_delete_request(path: impl Into<String>, data: Option<Map<String, Value>>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            operation: Operation::Delete,
            path: path.into(),
            client_token: String::new(),
            data,
            headers: HashMap::new(),
        }
    }

    pub fn new_list_request(path: impl Into<String>) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            operation: Operation::List,
            path: path.into(),
            client_token: String::new(),
            data: None,
            headers: HashMap::new(),
        }
    }
}

