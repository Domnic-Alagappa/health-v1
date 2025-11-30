use crate::domain::repositories::refresh_token_repository::{RefreshToken, RefreshTokenRepository};
use crate::infrastructure::database::queries::refresh_tokens::*;
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
        sqlx::query(REFRESH_TOKEN_INSERT)
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
        let row = sqlx::query(REFRESH_TOKEN_FIND_BY_HASH)
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
        let rows = sqlx::query(REFRESH_TOKEN_FIND_BY_USER_ID)
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
        sqlx::query(REFRESH_TOKEN_REVOKE)
        .bind(token_hash)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn revoke_all_user_tokens(&self, user_id: Uuid) -> AppResult<()> {
        sqlx::query(REFRESH_TOKEN_REVOKE_ALL_USER)
        .bind(user_id)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(())
    }

    async fn delete_expired_tokens(&self) -> AppResult<u64> {
        let result = sqlx::query(REFRESH_TOKEN_DELETE_EXPIRED)
        .execute(&self.pool)
        .await
        .map_err(|e| crate::shared::AppError::Database(e))?;
        
        Ok(result.rows_affected())
    }
}

