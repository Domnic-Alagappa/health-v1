use async_trait::async_trait;
use crate::domain::entities::User;
use crate::shared::AppResult;

#[async_trait]
pub trait AuthService: Send + Sync {
    async fn authenticate(&self, username: &str, password: &str) -> AppResult<Option<User>>;
    async fn verify_token(&self, token: &str) -> AppResult<Option<User>>;
    async fn refresh_token(&self, refresh_token: &str) -> AppResult<Option<String>>;
    async fn revoke_token(&self, token: &str) -> AppResult<()>;
}

