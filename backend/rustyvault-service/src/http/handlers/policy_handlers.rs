//! HTTP handlers for policy management

use std::sync::Arc;

use axum::{
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};

use crate::http::routes::AppState;
use crate::modules::policy::Policy;

/// List all policies
pub async fn list_policies(
    state: Arc<AppState>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let policy_store = state.policy_store.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "policy store not initialized" })),
        )
    })?;

    match policy_store.list_policies().await {
        Ok(policies) => Ok(Json(json!({
            "keys": policies
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

/// Read a policy
pub async fn read_policy(
    state: Arc<AppState>,
    name: String,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let policy_store = state.policy_store.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "policy store not initialized" })),
        )
    })?;

    match policy_store.get_policy(&name).await {
        Ok(Some(policy)) => Ok(Json(json!({
            "name": policy.name,
            "policy": policy.raw,
            "type": policy.policy_type.to_string()
        }))),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "policy not found" })),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

/// Create or update a policy
pub async fn write_policy(
    state: Arc<AppState>,
    name: String,
    payload: Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let policy_store = state.policy_store.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "policy store not initialized" })),
        )
    })?;

    // Get the policy content
    let policy_content = payload
        .get("policy")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "policy content is required" })),
            )
        })?;

    // Parse the policy
    let mut policy = Policy::from_json(policy_content).map_err(|e| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": format!("invalid policy: {}", e) })),
        )
    })?;

    policy.name = name;

    // Save the policy
    match policy_store.set_policy(&policy).await {
        Ok(_) => Ok(Json(json!({}))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

/// Delete a policy
pub async fn delete_policy(
    state: Arc<AppState>,
    name: String,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let policy_store = state.policy_store.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "policy store not initialized" })),
        )
    })?;

    match policy_store.delete_policy(&name).await {
        Ok(_) => Ok(Json(json!({}))),
        Err(e) => {
            if e.to_string().contains("cannot delete") {
                Err((
                    StatusCode::BAD_REQUEST,
                    Json(json!({ "error": e.to_string() })),
                ))
            } else {
                Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "error": e.to_string() })),
                ))
            }
        }
    }
}

/// Check capabilities for a path
pub async fn check_capabilities(
    state: Arc<AppState>,
    payload: Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let policy_store = state.policy_store.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "policy store not initialized" })),
        )
    })?;

    let path = payload
        .get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "path is required" })),
            )
        })?;

    let policies: Vec<String> = payload
        .get("policies")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default();

    match policy_store.check_capabilities(&policies, path).await {
        Ok(capabilities) => Ok(Json(json!({
            "capabilities": capabilities,
            "path": path
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

