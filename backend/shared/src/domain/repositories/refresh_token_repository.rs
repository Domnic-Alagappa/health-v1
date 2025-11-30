use async_trait::async_trait;
use crate::shared::AppResult;
use uuid::Uuid;
use chrono::DateTime;
use chrono::Utc;

#[derive(Debug, Clone)]
pub struct RefreshToken {
    pub id: Uuid,
    pub user_id: Uuid,
    pub token_hash: String,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub revoked_at: Option<DateTime<Utc>>,
    pub is_revoked: bool,
}

#[async_trait]
pub trait RefreshTokenRepository: Send + Sync {
    async fn create(&self, token: RefreshToken) -> AppResult<RefreshToken>;
    async fn find_by_token_hash(&self, token_hash: &str) -> AppResult<Option<RefreshToken>>;
    async fn find_by_user_id(&self, user_id: Uuid) -> AppResult<Vec<RefreshToken>>;
    async fn revoke_token(&self, token_hash: &str) -> AppResult<()>;
    async fn revoke_all_user_tokens(&self, user_id: Uuid) -> AppResult<()>;
    async fn delete_expired_tokens(&self) -> AppResult<u64>;
}

