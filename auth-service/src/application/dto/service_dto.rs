use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceStatusResponse {
    pub services: Vec<ServiceInfo>,
    pub overall_status: String, // "operational", "degraded", "down"
    pub checked_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ServiceInfo {
    pub name: String,
    pub enabled: bool,
    pub operational: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub health_endpoint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_checked: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

