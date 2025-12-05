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
    pub app_type: String,
    pub app_device: String,
}

impl Session {
    pub fn new(
        session_token: String,
        ip_address: IpAddr,
        user_agent: Option<String>,
        expires_at: DateTime<Utc>,
        app_type: String,
        app_device: String,
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
            app_type,
            app_device,
        }
    }

    pub fn authenticate(&mut self, user_id: Uuid, organization_id: Option<Uuid>) {
        self.user_id = Some(user_id);
        self.organization_id = organization_id;
        self.authenticated_at = Some(Utc::now());
        self.last_activity_at = Utc::now();
        self.updated_at = Utc::now();
        // Note: version is incremented by repository update() method for optimistic locking
    }

    pub fn update_activity(&mut self) {
        self.last_activity_at = Utc::now();
        self.updated_at = Utc::now();
        // Note: version is incremented by repository update() method for optimistic locking
    }

    pub fn end(&mut self) {
        self.ended_at = Some(Utc::now());
        self.is_active = false;
        self.updated_at = Utc::now();
        // Note: version is incremented by repository update() method for optimistic locking
    }

    pub fn is_expired(&self) -> bool {
        Utc::now() > self.expires_at
    }

    pub fn is_ghost_session(&self) -> bool {
        self.user_id.is_none()
    }

    pub fn is_admin_ui(&self) -> bool {
        self.app_type == "admin-ui"
    }

    pub fn is_client_ui(&self) -> bool {
        self.app_type == "client-ui"
    }

    pub fn is_api(&self) -> bool {
        self.app_type == "api"
    }

    pub fn is_web(&self) -> bool {
        self.app_device == "web"
    }

    pub fn is_mobile(&self) -> bool {
        self.app_device == "mobile"
    }

    pub fn is_desktop(&self) -> bool {
        self.app_device == "desktop"
    }

    pub fn is_tablet(&self) -> bool {
        self.app_device == "tablet"
    }
}

