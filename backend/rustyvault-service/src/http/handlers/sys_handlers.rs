//! System operation handlers

use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde_json::{json, Value};
use std::sync::Arc;
use base64::Engine;
use crate::http::routes::AppState;

/// Health check endpoint
pub async fn health_check() -> Result<Json<Value>, StatusCode> {
    Ok(Json(json!({
        "initialized": false,
        "sealed": true,
        "standby": false,
        "performance_standby": false,
        "replication_performance_mode": "disabled",
        "replication_dr_mode": "disabled",
        "server_time_utc": chrono::Utc::now().timestamp(),
        "version": "0.1.0",
        "cluster_name": "",
        "cluster_id": ""
    })))
}

/// Seal status endpoint (with State extractor)
pub async fn seal_status(
    State(state): State<Arc<AppState>>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    seal_status_with_state(state).await
}

/// Seal status endpoint (direct state parameter)
pub async fn seal_status_with_state(
    state: Arc<AppState>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let sealed = state.core.is_sealed();
    let seal_config = state.core.seal_config()
        .unwrap_or(crate::core::SealConfig {
            secret_shares: 5,
            secret_threshold: 3,
        });
    
    Ok(Json(json!({
        "sealed": sealed,
        "t": seal_config.secret_threshold,
        "n": seal_config.secret_shares,
        "progress": 0,
        "nonce": "",
        "version": "0.1.0",
        "cluster_name": "",
        "cluster_id": "",
        "recovery_seal": false,
        "storage_type": "file"
    })))
}

/// Seal endpoint (with State extractor)
pub async fn seal(
    State(state): State<Arc<AppState>>,
) -> Result<StatusCode, (StatusCode, Json<Value>)> {
    seal_with_state(state).await
}

/// Seal endpoint (direct state parameter)
pub async fn seal_with_state(
    state: Arc<AppState>,
) -> Result<StatusCode, (StatusCode, Json<Value>)> {
    state.core.seal().await
        .map_err(|e| (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        ))?;
    Ok(StatusCode::NO_CONTENT)
}

/// Unseal endpoint (with State extractor)
pub async fn unseal(
    State(state): State<Arc<AppState>>,
    payload: axum::extract::Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    unseal_with_state(state, payload).await
}

/// Unseal endpoint (direct state parameter)
pub async fn unseal_with_state(
    state: Arc<AppState>,
    payload: axum::extract::Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let key_str = payload.get("key")
        .and_then(|v| v.as_str())
        .ok_or_else(|| (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Missing 'key' field"})),
        ))?;

    let key = base64::engine::general_purpose::STANDARD.decode(key_str)
        .map_err(|_| (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Invalid base64 key"})),
        ))?;

    let unsealed = state.core.unseal(&key).await
        .map_err(|e| (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        ))?;

    Ok(Json(json!({
        "sealed": !unsealed,
    })))
}

/// Initialize endpoint (with State extractor)
pub async fn init(
    State(state): State<Arc<AppState>>,
    payload: axum::extract::Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    init_with_state(state, payload).await
}

/// Initialize endpoint (direct state parameter)
pub async fn init_with_state(
    state: Arc<AppState>,
    payload: axum::extract::Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let secret_shares = payload.get("secret_shares")
        .and_then(|v| v.as_u64())
        .map(|v| v as u8)
        .unwrap_or(5);
    
    let secret_threshold = payload.get("secret_threshold")
        .and_then(|v| v.as_u64())
        .map(|v| v as u8)
        .unwrap_or(3);

    let seal_config = crate::core::SealConfig {
        secret_shares,
        secret_threshold,
    };

    let result = state.core.init(&seal_config).await
        .map_err(|e| (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": e.to_string()})),
        ))?;

    // Convert keys to base64
    let keys: Vec<String> = result.secret_shares.iter()
        .map(|k| base64::engine::general_purpose::STANDARD.encode(k.as_slice()))
        .collect();

    Ok(Json(json!({
        "keys": keys,
        "keys_base64": keys,
        "root_token": result.root_token,
    })))
}

