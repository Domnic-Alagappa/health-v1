use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::net::IpAddr;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestLog {
    pub id: Uuid,
    pub session_id: Uuid,
    pub request_id: String,
    pub user_id: Option<Uuid>,
    pub method: String,
    pub path: String,
    pub query_string: Option<String>,
    pub ip_address: IpAddr,
    pub user_agent: Option<String>,
    pub status_code: i32,
    pub response_time_ms: Option<i32>,
    pub request_size_bytes: Option<i32>,
    pub response_size_bytes: Option<i32>,
    pub created_at: DateTime<Utc>,
    pub metadata: serde_json::Value,
}

impl RequestLog {
    pub fn new(
        session_id: Uuid,
        request_id: String,
        method: String,
        path: String,
        ip_address: IpAddr,
        status_code: u16,
    ) -> Self {
        Self {
            id: Uuid::new_v4(),
            session_id,
            request_id,
            user_id: None,
            method,
            path,
            query_string: None,
            ip_address,
            user_agent: None,
            status_code: status_code as i32,
            response_time_ms: None,
            request_size_bytes: None,
            response_size_bytes: None,
            created_at: Utc::now(),
            metadata: serde_json::json!({}),
        }
    }

    pub fn with_user_id(mut self, user_id: Uuid) -> Self {
        self.user_id = Some(user_id);
        self
    }

    pub fn with_query_string(mut self, query_string: String) -> Self {
        self.query_string = Some(query_string);
        self
    }

    pub fn with_user_agent(mut self, user_agent: String) -> Self {
        self.user_agent = Some(user_agent);
        self
    }

    pub fn with_response_time(mut self, response_time_ms: u64) -> Self {
        self.response_time_ms = Some(response_time_ms as i32);
        self
    }

    pub fn with_request_size(mut self, size_bytes: u64) -> Self {
        self.request_size_bytes = Some(size_bytes as i32);
        self
    }

    pub fn with_response_size(mut self, size_bytes: u64) -> Self {
        self.response_size_bytes = Some(size_bytes as i32);
        self
    }
    
    pub fn with_user_id_opt(mut self, user_id: Option<Uuid>) -> Self {
        if let Some(uid) = user_id {
            self.user_id = Some(uid);
        }
        self
    }
    
    pub fn with_query_string_opt(mut self, query_string: Option<String>) -> Self {
        if let Some(qs) = query_string {
            self.query_string = Some(qs);
        }
        self
    }
    
    pub fn with_user_agent_opt(mut self, user_agent: Option<String>) -> Self {
        if let Some(ua) = user_agent {
            self.user_agent = Some(ua);
        }
        self
    }

    pub fn with_metadata(mut self, metadata: serde_json::Value) -> Self {
        self.metadata = metadata;
        self
    }
}

