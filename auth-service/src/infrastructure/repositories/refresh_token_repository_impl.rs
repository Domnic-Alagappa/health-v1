use crate::domain::repositories::refresh_token_repository::{RefreshToken, RefreshTokenRepository};
use crate::shared::AppResult;
use async_trait::async_trait;
use sqlx::{PgPool, Row};
use uuid::Uuid;

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
        sqlx::query(
            r#"
            INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at, revoked_at, is_revoked)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#
        )
        .bind(token.id)
        .bind(token.user_id)
        .bind(&token.token_hash)
        .bind(token.expires_at)
        .bind(token.created_at)
        .bind(token.revoked_at)
        .bind(token.is_revoked)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        Ok(token)
    }

    async fn find_by_token_hash(&self, token_hash: &str) -> AppResult<Option<RefreshToken>> {
        let row = sqlx::query(
            r#"
            SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, is_revoked
            FROM refresh_tokens
            WHERE token_hash = $1 AND is_revoked = false AND expires_at > NOW()
            "#
        )
        .bind(token_hash)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        if let Some(r) = row {
            Ok(Some(RefreshToken {
                id: r.try_get("id").map_err(|e| crate::shared::AppError::Database(e))?,
                user_id: r.try_get("user_id").map_err(|e| crate::shared::AppError::Database(e))?,
                token_hash: r.try_get("token_hash").map_err(|e| crate::shared::AppError::Database(e))?,
                expires_at: r.try_get("expires_at").map_err(|e| crate::shared::AppError::Database(e))?,
                created_at: r.try_get("created_at").map_err(|e| crate::shared::AppError::Database(e))?,
                revoked_at: r.try_get("revoked_at").map_err(|e| crate::shared::AppError::Database(e))?,
                is_revoked: r.try_get("is_revoked").map_err(|e| crate::shared::AppError::Database(e))?,
            }))
        } else {
            Ok(None)
        }
    }

    async fn find_by_user_id(&self, user_id: Uuid) -> AppResult<Vec<RefreshToken>> {
        let rows = sqlx::query(
            r#"
            SELECT id, user_id, token_hash, expires_at, created_at, revoked_at, is_revoked
            FROM refresh_tokens
            WHERE user_id = $1
            ORDER BY created_at DESC
            "#
        )
        .bind(user_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;

        let mut tokens = Vec::new();
        for r in rows {
            tokens.push(RefreshToken {
                id: r.try_get("id").map_err(|e| crate::shared::AppError::Database(e))?,
                user_id: r.try_get("user_id").map_err(|e| crate::shared::AppError::Database(e))?,
                token_hash: r.try_get("token_hash").map_err(|e| crate::shared::AppError::Database(e))?,
                expires_at: r.try_get("expires_at").map_err(|e| crate::shared::AppError::Database(e))?,
                created_at: r.try_get("created_at").map_err(|e| crate::shared::AppError::Database(e))?,
                revoked_at: r.try_get("revoked_at").map_err(|e| crate::shared::AppError::Database(e))?,
                is_revoked: r.try_get("is_revoked").map_err(|e| crate::shared::AppError::Database(e))?,
            });
        }
        Ok(tokens)
    }

    async fn revoke_token(&self, token_hash: &str) -> AppResult<()> {
        sqlx::query(
            r#"
            UPDATE refresh_tokens
            SET is_revoked = true, revoked_at = NOW()
            WHERE token_hash = $1 AND is_revoked = false
            "#
        )
        .bind(token_hash)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn revoke_all_user_tokens(&self, user_id: Uuid) -> AppResult<()> {
        sqlx::query(
            r#"
            UPDATE refresh_tokens
            SET is_revoked = true, revoked_at = NOW()
            WHERE user_id = $1 AND is_revoked = false
            "#
        )
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn delete_expired_tokens(&self) -> AppResult<u64> {
        let result = sqlx::query(
            r#"
            DELETE FROM refresh_tokens
            WHERE expires_at < NOW() AND is_revoked = true
            "#
        )
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(result.rows_affected())
    }
}

