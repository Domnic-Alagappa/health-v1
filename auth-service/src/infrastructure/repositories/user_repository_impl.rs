use crate::domain::entities::User;
use crate::domain::repositories::UserRepository;
use crate::infrastructure::database::DatabaseService;
use crate::shared::AppResult;
use async_trait::async_trait;
use std::sync::Arc;
use uuid::Uuid;

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
        sqlx::query_as::<_, User>(
            r#"
            INSERT INTO users (
                id, email, username, password_hash, is_active, is_verified, is_super_user, 
                organization_id, created_at, updated_at, last_login,
                request_id, created_by, updated_by, system_id, version
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING id, email, username, password_hash, is_active, is_verified, is_super_user, 
                      organization_id, created_at, updated_at, last_login,
                      request_id, created_by, updated_by, system_id, version
            "#
        )
        .bind(user.id)
        .bind(user.email)
        .bind(user.username)
        .bind(user.password_hash)
        .bind(user.is_active)
        .bind(user.is_verified)
        .bind(user.is_super_user)
        .bind(user.organization_id)
        .bind(user.created_at)
        .bind(user.updated_at)
        .bind(user.last_login)
        .bind(user.request_id)
        .bind(user.created_by)
        .bind(user.updated_by)
        .bind(user.system_id)
        .bind(user.version)
        .fetch_one(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<User>> {
        sqlx::query_as::<_, User>(
            r#"
            SELECT id, email, username, password_hash, is_active, is_verified, is_super_user, 
                   organization_id, created_at, updated_at, last_login,
                   request_id, created_by, updated_by, system_id, version
            FROM users
            WHERE id = $1
            "#
        )
        .bind(id)
        .fetch_optional(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_email(&self, email: &str) -> AppResult<Option<User>> {
        sqlx::query_as::<_, User>(
            r#"
            SELECT id, email, username, password_hash, is_active, is_verified, is_super_user, 
                   organization_id, created_at, updated_at, last_login,
                   request_id, created_by, updated_by, system_id, version
            FROM users
            WHERE email = $1
            "#
        )
        .bind(email)
        .fetch_optional(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn find_by_username(&self, username: &str) -> AppResult<Option<User>> {
        sqlx::query_as::<_, User>(
            r#"
            SELECT id, email, username, password_hash, is_active, is_verified, is_super_user, 
                   organization_id, created_at, updated_at, last_login,
                   request_id, created_by, updated_by, system_id, version
            FROM users
            WHERE username = $1
            "#
        )
        .bind(username)
        .fetch_optional(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn update(&self, mut user: User) -> AppResult<User> {
        // Store current version for optimistic locking
        let current_version = user.version;
        // Increment version for update
        user.version += 1;
        
        sqlx::query_as::<_, User>(
            r#"
            UPDATE users
            SET email = $2, username = $3, password_hash = $4, is_active = $5, is_verified = $6, 
                is_super_user = $7, organization_id = $8, updated_at = $9, last_login = $10,
                request_id = $11, updated_by = $12, version = $13
            WHERE id = $1 AND version = $14
            RETURNING id, email, username, password_hash, is_active, is_verified, is_super_user, 
                      organization_id, created_at, updated_at, last_login,
                      request_id, created_by, updated_by, system_id, version
            "#
        )
        .bind(user.id)
        .bind(user.email)
        .bind(user.username)
        .bind(user.password_hash)
        .bind(user.is_active)
        .bind(user.is_verified)
        .bind(user.is_super_user)
        .bind(user.organization_id)
        .bind(user.updated_at)
        .bind(user.last_login)
        .bind(user.request_id)
        .bind(user.updated_by)
        .bind(user.version) // New incremented version
        .bind(current_version) // Current version for WHERE clause (optimistic locking)
        .fetch_one(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }

    async fn delete(&self, id: Uuid) -> AppResult<()> {
        sqlx::query(
            r#"
            DELETE FROM users
            WHERE id = $1
            "#
        )
        .bind(id)
        .execute(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn list(&self, limit: u32, offset: u32) -> AppResult<Vec<User>> {
        sqlx::query_as::<_, User>(
            r#"
            SELECT id, email, username, password_hash, is_active, is_verified, is_super_user, 
                   organization_id, created_at, updated_at, last_login,
                   request_id, created_by, updated_by, system_id, version
            FROM users
            ORDER BY created_at DESC
            LIMIT $1 OFFSET $2
            "#
        )
        .bind(limit as i64)
        .bind(offset as i64)
        .fetch_all(self.database_service.pool())
        .await
        .map_err(|e| crate::shared::AppError::Database(e))
    }
}

