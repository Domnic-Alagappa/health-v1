use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::FromRow;
use uuid::Uuid;
use crate::shared::AuditFields;

/// Organization entity representing a tenant in a multi-tenant system
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Organization {
    pub id: Uuid,
    pub name: String,
    pub slug: String,
    pub domain: Option<String>,
    pub settings: Value,
    // Audit fields
    pub request_id: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub system_id: Option<String>,
    pub version: i64,
}

impl Organization {
    /// Create a new organization
    pub fn new(name: String, slug: String, domain: Option<String>) -> Self {
        let audit = AuditFields::new();
        Self {
            id: Uuid::new_v4(),
            name,
            slug,
            domain,
            settings: Value::Object(serde_json::Map::new()),
            request_id: audit.request_id,
            created_at: audit.created_at,
            updated_at: audit.updated_at,
            created_by: audit.created_by,
            updated_by: audit.updated_by,
            system_id: audit.system_id,
            version: audit.version,
        }
    }

    /// Update organization name
    pub fn update_name(&mut self, name: String) {
        self.name = name;
        self.updated_at = Utc::now();
        self.version += 1;
    }

    /// Update organization domain
    pub fn update_domain(&mut self, domain: Option<String>) {
        self.domain = domain;
        self.updated_at = Utc::now();
        self.version += 1;
    }

    /// Update organization settings
    pub fn update_settings(&mut self, settings: Value) {
        self.settings = settings;
        self.updated_at = Utc::now();
        self.version += 1;
    }

    /// Get a setting value by key
    pub fn get_setting(&self, key: &str) -> Option<&Value> {
        self.settings.as_object()?.get(key)
    }

    /// Set a setting value by key
    pub fn set_setting(&mut self, key: String, value: Value) {
        if let Some(map) = self.settings.as_object_mut() {
            map.insert(key, value);
            self.updated_at = Utc::now();
            self.version += 1;
        } else {
            // If settings is not an object, create a new object
            let mut map = serde_json::Map::new();
            map.insert(key, value);
            self.settings = Value::Object(map);
            self.updated_at = Utc::now();
            self.version += 1;
        }
    }

    /// Remove a setting by key
    pub fn remove_setting(&mut self, key: &str) -> Option<Value> {
        if let Some(map) = self.settings.as_object_mut() {
            let removed = map.remove(key);
            if removed.is_some() {
                self.updated_at = Utc::now();
                self.version += 1;
            }
            removed
        } else {
            None
        }
    }

    /// Touch the record (update audit fields)
    pub fn touch(&mut self, request_id: Option<String>, updated_by: Option<Uuid>) {
        self.request_id = request_id;
        self.updated_at = Utc::now();
        self.updated_by = updated_by;
        self.version += 1;
    }

    /// Set audit fields for create operation
    pub fn set_audit_create(
        &mut self,
        request_id: Option<String>,
        created_by: Option<Uuid>,
        system_id: Option<String>,
    ) {
        let now = Utc::now();
        self.request_id = request_id;
        self.created_at = now;
        self.updated_at = now;
        self.created_by = created_by;
        self.updated_by = created_by;
        self.system_id = system_id;
        self.version = 1;
    }
}

