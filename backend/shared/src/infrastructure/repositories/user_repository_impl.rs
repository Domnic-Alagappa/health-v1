use crate::domain::entities::User;
use crate::domain::repositories::UserRepository;
use crate::infrastructure::database::DatabaseService;
use crate::shared::AppResult;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::FromRow;
use std::sync::Arc;
use uuid::Uuid;

/// Temporary struct for database deserialization (matches database column order)
#[derive(Debug, FromRow)]
struct UserRow {
    id: Uuid,
    email: String,
    username: String,
    password_hash: String,
    is_active: bool,
    is_verified: bool,
    is_super_user: bool,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    last_login: Option<DateTime<Utc>>,
    organization_id: Option<Uuid>,
    request_id: Option<String>,
    created_by: Option<Uuid>,
    updated_by: Option<Uuid>,
    system_id: Option<String>,
    version: i64,
}

impl From<UserRow> for User {
    fn from(row: UserRow) -> Self {
        User {
            id: row.id,
            email: row.email,
            username: row.username,
            password_hash: row.password_hash,
            is_active: row.is_active,
            is_verified: row.is_verified,
            is_super_user: row.is_super_user,
            organization_id: row.organization_id,
            last_login: row.last_login,
            request_id: row.request_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            created_by: row.created_by,
            updated_by: row.updated_by,
            system_id: row.system_id,
            version: row.version,
        }
    }
}

pub struct UserRepositoryImpl {
    database_service: Arc<DatabaseService>,
}

impl UserRepositoryImpl {
    pub fn new(database_service: Arc<DatabaseService>) -> Self {
        Self { database_service }
    }
}

#[async_trait]
impl UserRepository for UserRepositoryImpl {
    async fn create(&self, user: User) -> AppResult<User> {
        let location = concat!(file!(), ":", line!());
        let row: UserRow = sqlx::query_as!(
            UserRow,
            r#"
            INSERT INTO users (
                id, email, username, password_hash, is_active, is_verified, is_super_user, 
                organization_id, created_at, updated_at, last_login,
                request_id, created_by, updated_by, system_id, version
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING 
                id, email, username, password_hash, is_active, is_verified, is_super_user, 
                created_at, updated_at, last_login, organization_id, request_id,
                created_by, updated_by, system_id, version
            "#,
            user.id,
            user.email,
            user.username,
            user.password_hash,
            user.is_active,
            user.is_verified,
            user.is_super_user,
            user.organization_id,
            user.created_at,
            user.updated_at,
            user.last_login,
            user.request_id,
            user.created_by,
            user.updated_by,
            user.system_id,
            user.version
        )
        .fetch_one(self.database_service.pool())
        .await
        .map_err(|e| {
            let err = crate::shared::AppError::Database(e);
            err.log_with_operation(location, "user_repository.create");
            err
        })?;
        Ok(row.into())
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<User>> {
        let location = concat!(file!(), ":", line!());
        let row = sqlx::query_as!(
            UserRow,
            r#"
            SELECT id, email, username, password_hash, is_active, is_verified, is_super_user, 
                   created_at, updated_at, last_login, organization_id, request_id,
                   created_by, updated_by, system_id, version
            FROM users
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(self.database_service.pool())
        .await
        .map_err(|e| {
            let err = crate::shared::AppError::Database(e);
            err.log_with_operation(location, "user_repository.find_by_id");
            err
        })?;
        Ok(row.map(|r| r.into()))
    }

    async fn find_by_email(&self, email: &str) -> AppResult<Option<User>> {
        let location = concat!(file!(), ":", line!());
        let row = sqlx::query_as!(
            UserRow,
            r#"
            SELECT 
                id, email, username, password_hash, is_active, is_verified, is_super_user, 
                created_at, updated_at, last_login, organization_id, request_id,
                created_by, updated_by, system_id, version
            FROM users
            WHERE email = $1
            "#,
            email
        )
        .fetch_optional(self.database_service.pool())
        .await
        .map_err(|e| {
            let err = crate::shared::AppError::Database(e);
            err.log_with_operation(location, "user_repository.find_by_email");
            err
        })?;
        Ok(row.map(|r| r.into()))
    }

    async fn find_by_username(&self, username: &str) -> AppResult<Option<User>> {
        let row = sqlx::query_as!(
            UserRow,
            r#"
            SELECT 
                id, email, username, password_hash, is_active, is_verified, is_super_user, 
                created_at, updated_at, last_login, organization_id, request_id,
                created_by, updated_by, system_id, version
            FROM users
            WHERE username = $1
            "#,
            username
        )
        .fetch_optional(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        Ok(row.map(|r| r.into()))
    }

    async fn update(&self, mut user: User) -> AppResult<User> {
        // Store current version for optimistic locking
        let current_version = user.version;
        // Increment version for update
        user.version += 1;
        
        let row: UserRow = sqlx::query_as!(
            UserRow,
            r#"
            UPDATE users
            SET email = $2, username = $3, password_hash = $4, is_active = $5, is_verified = $6, 
                is_super_user = $7, organization_id = $8, updated_at = $9, last_login = $10,
                request_id = $11, updated_by = $12, version = $13
            WHERE id = $1 AND version = $14
            RETURNING 
                id, email, username, password_hash, is_active, is_verified, is_super_user, 
                created_at, updated_at, last_login, organization_id, request_id,
                created_by, updated_by, system_id, version
            "#,
            user.id,
            user.email,
            user.username,
            user.password_hash,
            user.is_active,
            user.is_verified,
            user.is_super_user,
            user.organization_id,
            user.updated_at,
            user.last_login,
            user.request_id,
            user.updated_by,
            user.version, // New incremented version
            current_version // Current version for WHERE clause (optimistic locking)
        )
        .fetch_one(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        Ok(row.into())
    }

    async fn delete(&self, id: Uuid) -> AppResult<()> {
        sqlx::query!(
            r#"
            DELETE FROM users
            WHERE id = $1
            "#,
            id
        )
        .execute(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn list(&self, limit: u32, offset: u32) -> AppResult<Vec<User>> {
        let limit_i64 = limit as i64;
        let offset_i64 = offset as i64;
        let rows = sqlx::query_as!(
            UserRow,
            r#"
            SELECT 
                id, email, username, password_hash, is_active, is_verified, is_super_user, 
                created_at, updated_at, last_login, organization_id, request_id,
                created_by, updated_by, system_id, version
            FROM users
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#,
            limit_i64,
            offset_i64
        )
        .fetch_all(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        Ok(rows.into_iter().map(|r| r.into()).collect())
    }
}

