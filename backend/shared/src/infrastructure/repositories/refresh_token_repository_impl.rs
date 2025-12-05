use crate::domain::repositories::refresh_token_repository::{RefreshToken, RefreshTokenRepository};
use crate::shared::AppResult;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

/// Temporary struct for database deserialization
#[derive(Debug)]
struct RefreshTokenRow {
    id: Uuid,
    user_id: Uuid,
    token_hash: String,
    expires_at: DateTime<Utc>,
    created_at: DateTime<Utc>,
    revoked_at: Option<DateTime<Utc>>,
    is_revoked: bool,
}

impl From<RefreshTokenRow> for RefreshToken {
    fn from(row: RefreshTokenRow) -> Self {
        RefreshToken {
            id: row.id,
            user_id: row.user_id,
            token_hash: row.token_hash,
            expires_at: row.expires_at,
            created_at: row.created_at,
            revoked_at: row.revoked_at,
            is_revoked: row.is_revoked,
        }
    }
}

pub struct RefreshTokenRepositoryImpl {
    pool: PgPool,
}

impl RefreshTokenRepositoryImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl RefreshTokenRepository for RefreshTokenRepositoryImpl {
    async fn create(&self, token: RefreshToken) -> AppResult<RefreshToken> {
        sqlx::query!(
            r#"
            INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at, revoked_at, is_revoked)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
            token.id,
            token.user_id,
            token.token_hash,
            token.expires_at,
            token.created_at,
            token.revoked_at,
            token.is_revoked
        )
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        Ok(token)
    }

    async fn find_by_token_hash(&self, token_hash: &str) -> AppResult<Option<RefreshToken>> {
        let row = sqlx::query_as!(
            RefreshTokenRow,
            r#"
            SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, is_revoked
            FROM refresh_tokens
            WHERE token_hash = $1 AND is_revoked = false AND expires_at > NOW()
            "#,
            token_hash
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        Ok(row.map(|r| r.into()))
    }

    async fn find_by_user_id(&self, user_id: Uuid) -> AppResult<Vec<RefreshToken>> {
        let rows = sqlx::query_as!(
            RefreshTokenRow,
            r#"
            SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, is_revoked
            FROM refresh_tokens
            WHERE user_id = $1
            ORDER BY created_at DESC
            "#,
            user_id
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        Ok(rows.into_iter().map(|r| r.into()).collect())
    }

    async fn revoke_token(&self, token_hash: &str) -> AppResult<()> {
        sqlx::query!(
            r#"
            UPDATE refresh_tokens
            SET is_revoked = true, revoked_at = NOW()
            WHERE token_hash = $1 AND is_revoked = false
            "#,
            token_hash
        )
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn revoke_all_user_tokens(&self, user_id: Uuid) -> AppResult<()> {
        sqlx::query!(
            r#"
            UPDATE refresh_tokens
            SET is_revoked = true, revoked_at = NOW()
            WHERE user_id = $1 AND is_revoked = false
            "#,
            user_id
        )
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn delete_expired_tokens(&self) -> AppResult<u64> {
        let result = sqlx::query!(
            r#"
            DELETE FROM refresh_tokens
            WHERE expires_at < NOW() AND is_revoked = true
            "#,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(result.rows_affected())
    }
}

