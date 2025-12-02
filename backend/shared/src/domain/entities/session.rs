use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::net::IpAddr;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Session {
    pub id: Uuid,
    pub session_token: String,
    pub user_id: Option<Uuid>,
    pub organization_id: Option<Uuid>,
    pub ip_address: IpAddr,
    pub user_agent: Option<String>,
    pub started_at: DateTime<Utc>,
    pub authenticated_at: Option<DateTime<Utc>>,
    pub last_activity_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub ended_at: Option<DateTime<Utc>>,
    pub is_active: bool,
    pub metadata: serde_json::Value,
    // Audit fields
    pub request_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub system_id: Option<String>,
    pub version: i64,
}

impl Session {
    pub fn new(
        session_token: String,
        ip_address: IpAddr,
        user_agent: Option<String>,
        expires_at: DateTime<Utc>,
    ) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            session_token,
            user_id: None,
            organization_id: None,
            ip_address,
            user_agent,
            started_at: now,
            authenticated_at: None,
            last_activity_at: now,
            expires_at,
            ended_at: None,
            is_active: true,
            metadata: serde_json::json!({}),
            request_id: None,
            created_at: now,
            updated_at: now,
            created_by: None,
            updated_by: None,
            system_id: None,
            version: 1,
        }
    }

    pub fn authenticate(&mut self, user_id: Uuid, organization_id: Option<Uuid>) {
        self.user_id = Some(user_id);
        self.organization_id = organization_id;
        self.authenticated_at = Some(Utc::now());
        self.last_activity_at = Utc::now();
        self.updated_at = Utc::now();
        self.version += 1;
    }

    pub fn update_activity(&mut self) {
        self.last_activity_at = Utc::now();
        self.updated_at = Utc::now();
        self.version += 1;
    }

    pub fn end(&mut self) {
        self.ended_at = Some(Utc::now());
        self.is_active = false;
        self.updated_at = Utc::now();
        self.version += 1;
    }

    pub fn is_expired(&self) -> bool {
        Utc::now() > self.expires_at
    }

    pub fn is_ghost_session(&self) -> bool {
        self.user_id.is_none()
    }
}

