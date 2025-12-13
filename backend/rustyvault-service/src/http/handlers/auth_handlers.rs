//! HTTP handlers for authentication

use std::sync::Arc;

use axum::{
    http::StatusCode,
    Json,
};
use serde_json::{json, Value};

use crate::http::routes::AppState;
use crate::modules::auth::{CreateTokenRequest, CreateUserRequest};

// ============================================================================
// Token Handlers
// ============================================================================

/// Create a new token
pub async fn create_token(
    state: Arc<AppState>,
    payload: Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let token_store = state.token_store.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "token store not initialized" })),
        )
    })?;

    let request = CreateTokenRequest {
        display_name: payload
            .get("display_name")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        policies: payload
            .get("policies")
            .and_then(|v| v.as_array())
            .map(|arr| {
                arr.iter()
                    .filter_map(|v| v.as_str().map(String::from))
                    .collect()
            })
            .unwrap_or_default(),
        ttl: payload.get("ttl").and_then(|v| v.as_i64()).unwrap_or(3600),
        renewable: payload
            .get("renewable")
            .and_then(|v| v.as_bool())
            .unwrap_or(true),
        num_uses: payload
            .get("num_uses")
            .and_then(|v| v.as_i64())
            .unwrap_or(0) as i32,
        meta: payload.get("meta").cloned(),
    };

    // TODO: Get parent token from request headers and validate
    match token_store.create_token(&request, None, "auth/token/create").await {
        Ok((entry, raw_token)) => Ok(Json(json!({
            "auth": {
                "client_token": raw_token,
                "accessor": format!("accessor.{}", entry.id),
                "policies": entry.policies,
                "token_ttl": entry.ttl,
                "renewable": entry.renewable,
                "expires_at": entry.expires_at
            }
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

/// Lookup a token
pub async fn lookup_token(
    state: Arc<AppState>,
    payload: Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let token_store = state.token_store.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "token store not initialized" })),
        )
    })?;

    let token = payload
        .get("token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "token is required" })),
            )
        })?;

    match token_store.lookup_token(token).await {
        Ok(Some(entry)) => Ok(Json(json!({
            "data": {
                "id": entry.id,
                "display_name": entry.display_name,
                "policies": entry.policies,
                "ttl": entry.ttl,
                "expires_at": entry.expires_at,
                "created_at": entry.created_at,
                "last_used_at": entry.last_used_at,
                "renewable": entry.renewable,
                "path": entry.path
            }
        }))),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "token not found or expired" })),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

/// Lookup self token
pub async fn lookup_self_token(
    state: Arc<AppState>,
    token: String,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let token_store = state.token_store.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "token store not initialized" })),
        )
    })?;

    match token_store.lookup_token(&token).await {
        Ok(Some(entry)) => Ok(Json(json!({
            "data": {
                "id": entry.id,
                "display_name": entry.display_name,
                "policies": entry.policies,
                "ttl": entry.ttl,
                "expires_at": entry.expires_at,
                "created_at": entry.created_at,
                "last_used_at": entry.last_used_at,
                "renewable": entry.renewable,
                "path": entry.path
            }
        }))),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "token not found or expired" })),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

/// Renew a token
pub async fn renew_token(
    state: Arc<AppState>,
    payload: Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let token_store = state.token_store.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "token store not initialized" })),
        )
    })?;

    let token = payload
        .get("token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "token is required" })),
            )
        })?;

    let increment = payload.get("increment").and_then(|v| v.as_i64());

    match token_store.renew_token(token, increment).await {
        Ok(entry) => Ok(Json(json!({
            "auth": {
                "client_token": token,
                "policies": entry.policies,
                "token_ttl": entry.ttl,
                "renewable": entry.renewable,
                "expires_at": entry.expires_at
            }
        }))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

/// Revoke a token
pub async fn revoke_token(
    state: Arc<AppState>,
    payload: Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let token_store = state.token_store.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "token store not initialized" })),
        )
    })?;

    let token = payload
        .get("token")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "token is required" })),
            )
        })?;

    match token_store.revoke_token(token).await {
        Ok(_) => Ok(Json(json!({}))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

/// Revoke self token
pub async fn revoke_self_token(
    state: Arc<AppState>,
    token: String,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let token_store = state.token_store.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "token store not initialized" })),
        )
    })?;

    match token_store.revoke_token(&token).await {
        Ok(_) => Ok(Json(json!({}))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

// ============================================================================
// UserPass Handlers
// ============================================================================

/// List userpass users
pub async fn list_userpass_users(
    state: Arc<AppState>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let userpass = state.userpass.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "userpass auth not enabled" })),
        )
    })?;

    match userpass.list_users().await {
        Ok(users) => Ok(Json(json!({
            "keys": users
        }))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

/// Create or update a userpass user
pub async fn create_userpass_user(
    state: Arc<AppState>,
    username: String,
    payload: Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let userpass = state.userpass.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "userpass auth not enabled" })),
        )
    })?;

    let password = payload
        .get("password")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "password is required" })),
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

    let ttl = payload.get("ttl").and_then(|v| v.as_i64()).unwrap_or(3600);
    let max_ttl = payload
        .get("max_ttl")
        .and_then(|v| v.as_i64())
        .unwrap_or(86400);

    let request = CreateUserRequest {
        username,
        password: password.to_string(),
        policies,
        ttl,
        max_ttl,
    };

    match userpass.create_user(&request).await {
        Ok(_) => Ok(Json(json!({}))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

/// Read a userpass user
pub async fn read_userpass_user(
    state: Arc<AppState>,
    username: String,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let userpass = state.userpass.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "userpass auth not enabled" })),
        )
    })?;

    match userpass.get_user(&username).await {
        Ok(Some(user)) => Ok(Json(json!({
            "data": {
                "username": user.username,
                "policies": user.policies,
                "ttl": user.ttl,
                "max_ttl": user.max_ttl
            }
        }))),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(json!({ "error": "user not found" })),
        )),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

/// Delete a userpass user
pub async fn delete_userpass_user(
    state: Arc<AppState>,
    username: String,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let userpass = state.userpass.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "userpass auth not enabled" })),
        )
    })?;

    match userpass.delete_user(&username).await {
        Ok(_) => Ok(Json(json!({}))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

/// Login with userpass
pub async fn userpass_login(
    state: Arc<AppState>,
    username: String,
    payload: Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    let userpass = state.userpass.as_ref().ok_or_else(|| {
        (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(json!({ "error": "userpass auth not enabled" })),
        )
    })?;

    let password = payload
        .get("password")
        .and_then(|v| v.as_str())
        .ok_or_else(|| {
            (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": "password is required" })),
            )
        })?;

    match userpass.login(&username, password).await {
        Ok(response) => Ok(Json(json!({
            "auth": {
                "client_token": response.client_token,
                "accessor": response.accessor,
                "policies": response.policies,
                "token_ttl": response.token_ttl,
                "renewable": response.renewable
            }
        }))),
        Err(e) => Err((
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": e.to_string() })),
        )),
    }
}

