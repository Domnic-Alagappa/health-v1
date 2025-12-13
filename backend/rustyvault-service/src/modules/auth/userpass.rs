//! UserPass authentication method for RustyVault
//!
//! Provides username/password based authentication with:
//! - User CRUD operations
//! - Password hashing with bcrypt
//! - Token issuance on successful login

use async_trait::async_trait;
use bcrypt::{hash, verify, DEFAULT_COST};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use super::token::{CreateTokenRequest, TokenStore};
use crate::errors::{VaultError, VaultResult};
use crate::logical::{Backend, Request, Response};

/// User entry in the database
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserEntry {
    pub id: Uuid,
    pub username: String,
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub policies: Vec<String>,
    pub ttl: i64,
    pub max_ttl: i64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Request to create or update a user
#[derive(Debug, Clone, Deserialize)]
pub struct CreateUserRequest {
    pub username: String,
    pub password: String,
    #[serde(default)]
    pub policies: Vec<String>,
    #[serde(default = "default_ttl")]
    pub ttl: i64,
    #[serde(default = "default_max_ttl")]
    pub max_ttl: i64,
}

fn default_ttl() -> i64 {
    3600
}

fn default_max_ttl() -> i64 {
    86400
}

/// Response when looking up a user
#[derive(Debug, Clone, Serialize)]
pub struct UserResponse {
    pub username: String,
    pub policies: Vec<String>,
    pub ttl: i64,
    pub max_ttl: i64,
}

/// Login request
#[derive(Debug, Clone, Deserialize)]
pub struct LoginRequest {
    pub password: String,
}

/// Login response
#[derive(Debug, Clone, Serialize)]
pub struct LoginResponse {
    pub client_token: String,
    pub accessor: String,
    pub policies: Vec<String>,
    pub token_ttl: i64,
    pub renewable: bool,
}

/// UserPass backend for authentication
pub struct UserPassBackend {
    pool: PgPool,
    token_store: TokenStore,
    mount_path: String,
}

impl UserPassBackend {
    /// Create a new UserPass backend
    pub fn new(pool: PgPool, mount_path: &str) -> Self {
        let token_store = TokenStore::new(pool.clone());
        UserPassBackend {
            pool,
            token_store,
            mount_path: mount_path.to_string(),
        }
    }

    /// Create a new user
    pub async fn create_user(&self, request: &CreateUserRequest) -> VaultResult<UserEntry> {
        let username = request.username.to_lowercase().trim().to_string();

        if username.is_empty() {
            return Err(VaultError::Vault("username cannot be empty".to_string()));
        }

        if request.password.is_empty() {
            return Err(VaultError::Vault("password cannot be empty".to_string()));
        }

        // Hash the password
        let password_hash = hash(&request.password, DEFAULT_COST)
            .map_err(|e| VaultError::Vault(format!("failed to hash password: {}", e)))?;

        let id = Uuid::new_v4();
        let now = Utc::now();

        let entry = UserEntry {
            id,
            username: username.clone(),
            password_hash,
            policies: request.policies.clone(),
            ttl: request.ttl,
            max_ttl: request.max_ttl,
            created_at: now,
            updated_at: now,
        };

        // Insert into database (upsert)
        sqlx::query(
            r#"
            INSERT INTO vault_users (id, username, password_hash, policies, ttl, max_ttl, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (username) DO UPDATE SET
                password_hash = $3,
                policies = $4,
                ttl = $5,
                max_ttl = $6,
                updated_at = $8
            "#,
        )
        .bind(entry.id)
        .bind(&entry.username)
        .bind(&entry.password_hash)
        .bind(&entry.policies)
        .bind(entry.ttl)
        .bind(entry.max_ttl)
        .bind(entry.created_at)
        .bind(entry.updated_at)
        .execute(&self.pool)
        .await
        .map_err(|e| VaultError::Vault(format!("failed to create user: {}", e)))?;

        Ok(entry)
    }

    /// Get a user by username
    pub async fn get_user(&self, username: &str) -> VaultResult<Option<UserEntry>> {
        let username = username.to_lowercase().trim().to_string();

        let row: Option<(
            Uuid,
            String,
            String,
            Vec<String>,
            i64,
            i64,
            DateTime<Utc>,
            DateTime<Utc>,
        )> = sqlx::query_as(
            r#"
            SELECT id, username, password_hash, policies, ttl, max_ttl, created_at, updated_at
            FROM vault_users
            WHERE username = $1
            "#,
        )
        .bind(&username)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| VaultError::Vault(format!("failed to get user: {}", e)))?;

        match row {
            Some((id, username, password_hash, policies, ttl, max_ttl, created_at, updated_at)) => {
                Ok(Some(UserEntry {
                    id,
                    username,
                    password_hash,
                    policies,
                    ttl,
                    max_ttl,
                    created_at,
                    updated_at,
                }))
            }
            None => Ok(None),
        }
    }

    /// List all users
    pub async fn list_users(&self) -> VaultResult<Vec<String>> {
        let rows: Vec<(String,)> = sqlx::query_as(
            r#"
            SELECT username FROM vault_users ORDER BY username
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| VaultError::Vault(format!("failed to list users: {}", e)))?;

        Ok(rows.into_iter().map(|(u,)| u).collect())
    }

    /// Delete a user
    pub async fn delete_user(&self, username: &str) -> VaultResult<()> {
        let username = username.to_lowercase().trim().to_string();

        sqlx::query("DELETE FROM vault_users WHERE username = $1")
            .bind(&username)
            .execute(&self.pool)
            .await
            .map_err(|e| VaultError::Vault(format!("failed to delete user: {}", e)))?;

        Ok(())
    }

    /// Update user password
    pub async fn update_password(&self, username: &str, new_password: &str) -> VaultResult<()> {
        let username = username.to_lowercase().trim().to_string();

        if new_password.is_empty() {
            return Err(VaultError::Vault("password cannot be empty".to_string()));
        }

        let password_hash = hash(new_password, DEFAULT_COST)
            .map_err(|e| VaultError::Vault(format!("failed to hash password: {}", e)))?;

        sqlx::query(
            r#"
            UPDATE vault_users
            SET password_hash = $1, updated_at = NOW()
            WHERE username = $2
            "#,
        )
        .bind(&password_hash)
        .bind(&username)
        .execute(&self.pool)
        .await
        .map_err(|e| VaultError::Vault(format!("failed to update password: {}", e)))?;

        Ok(())
    }

    /// Update user policies
    pub async fn update_policies(&self, username: &str, policies: &[String]) -> VaultResult<()> {
        let username = username.to_lowercase().trim().to_string();

        sqlx::query(
            r#"
            UPDATE vault_users
            SET policies = $1, updated_at = NOW()
            WHERE username = $2
            "#,
        )
        .bind(policies)
        .bind(&username)
        .execute(&self.pool)
        .await
        .map_err(|e| VaultError::Vault(format!("failed to update policies: {}", e)))?;

        Ok(())
    }

    /// Login with username and password
    pub async fn login(&self, username: &str, password: &str) -> VaultResult<LoginResponse> {
        let user = self
            .get_user(username)
            .await?
            .ok_or_else(|| VaultError::Vault("invalid username or password".to_string()))?;

        // Verify password
        let valid = verify(password, &user.password_hash)
            .map_err(|e| VaultError::Vault(format!("failed to verify password: {}", e)))?;

        if !valid {
            return Err(VaultError::Vault("invalid username or password".to_string()));
        }

        // Create token for the user
        let request = CreateTokenRequest {
            display_name: format!("userpass-{}", user.username),
            policies: user.policies.clone(),
            ttl: user.ttl,
            renewable: true,
            num_uses: 0,
            meta: Some(serde_json::json!({
                "username": user.username,
                "auth_method": "userpass"
            })),
        };

        let path = format!("{}/login/{}", self.mount_path, user.username);
        let (entry, raw_token) = self.token_store.create_token(&request, None, &path).await?;

        Ok(LoginResponse {
            client_token: raw_token,
            accessor: format!("accessor.{}", entry.id),
            policies: user.policies,
            token_ttl: user.ttl,
            renewable: true,
        })
    }
}

#[async_trait]
impl Backend for UserPassBackend {
    async fn handle_request(&self, req: &mut Request) -> VaultResult<Option<Response>> {
        // Parse the path to determine the operation
        let path = req.path.trim_start_matches(&self.mount_path).trim_start_matches('/');
        let parts: Vec<&str> = path.split('/').collect();

        match (req.operation.clone(), parts.as_slice()) {
            // List users: GET /auth/userpass/users
            (crate::logical::request::Operation::List, ["users"]) => {
                let users = self.list_users().await?;
                let mut data = serde_json::Map::new();
                data.insert("keys".to_string(), serde_json::json!(users));
                Ok(Some(Response {
                    data: Some(data),
                    ..Default::default()
                }))
            }

            // Create/update user: POST /auth/userpass/users/:username
            (crate::logical::request::Operation::Write, ["users", username]) => {
                let body = req.data.as_ref().ok_or_else(|| {
                    VaultError::Vault("missing request body".to_string())
                })?;

                let password = body
                    .get("password")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| VaultError::Vault("password is required".to_string()))?;

                let policies: Vec<String> = body
                    .get("policies")
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default();

                let ttl = body
                    .get("ttl")
                    .and_then(|v| v.as_i64())
                    .unwrap_or(default_ttl());

                let max_ttl = body
                    .get("max_ttl")
                    .and_then(|v| v.as_i64())
                    .unwrap_or(default_max_ttl());

                let request = CreateUserRequest {
                    username: username.to_string(),
                    password: password.to_string(),
                    policies,
                    ttl,
                    max_ttl,
                };

                self.create_user(&request).await?;

                Ok(Some(Response::default()))
            }

            // Read user: GET /auth/userpass/users/:username
            (crate::logical::request::Operation::Read, ["users", username]) => {
                match self.get_user(username).await? {
                    Some(user) => {
                        let mut data = serde_json::Map::new();
                        data.insert("username".to_string(), serde_json::json!(user.username));
                        data.insert("policies".to_string(), serde_json::json!(user.policies));
                        data.insert("ttl".to_string(), serde_json::json!(user.ttl));
                        data.insert("max_ttl".to_string(), serde_json::json!(user.max_ttl));
                        Ok(Some(Response {
                            data: Some(data),
                            ..Default::default()
                        }))
                    }
                    None => Err(VaultError::Vault("user not found".to_string())),
                }
            }

            // Delete user: DELETE /auth/userpass/users/:username
            (crate::logical::request::Operation::Delete, ["users", username]) => {
                self.delete_user(username).await?;
                Ok(Some(Response::default()))
            }

            // Login: POST /auth/userpass/login/:username
            (crate::logical::request::Operation::Write, ["login", username]) => {
                let body = req.data.as_ref().ok_or_else(|| {
                    VaultError::Vault("missing request body".to_string())
                })?;

                let password = body
                    .get("password")
                    .and_then(|v| v.as_str())
                    .ok_or_else(|| VaultError::Vault("password is required".to_string()))?;

                let response = self.login(username, password).await?;

                let mut data = serde_json::Map::new();
                data.insert("client_token".to_string(), serde_json::json!(response.client_token.clone()));
                data.insert("accessor".to_string(), serde_json::json!(response.accessor.clone()));
                data.insert("policies".to_string(), serde_json::json!(response.policies.clone()));
                data.insert("token_ttl".to_string(), serde_json::json!(response.token_ttl));
                data.insert("renewable".to_string(), serde_json::json!(response.renewable));

                Ok(Some(Response {
                    data: Some(data),
                    auth: Some(crate::logical::ResponseAuth {
                        client_token: response.client_token,
                        accessor: response.accessor,
                        policies: response.policies,
                        token_ttl: response.token_ttl,
                        renewable: response.renewable,
                        ..Default::default()
                    }),
                    ..Default::default()
                }))
            }

            _ => Ok(None),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_password_hash_and_verify() {
        let password = "secret123";
        let hash = hash(password, DEFAULT_COST).unwrap();
        
        assert!(verify(password, &hash).unwrap());
        assert!(!verify("wrong_password", &hash).unwrap());
    }
}

