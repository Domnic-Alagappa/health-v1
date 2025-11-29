use async_trait::async_trait;
use crate::domain::entities::User;
use crate::shared::AppResult;
use uuid::Uuid;

#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn create(&self, user: User) -> AppResult<User>;
    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<User>>;
    async fn find_by_email(&self, email: &str) -> AppResult<Option<User>>;
    async fn find_by_username(&self, username: &str) -> AppResult<Option<User>>;
    async fn update(&self, user: User) -> AppResult<User>;
    async fn delete(&self, id: Uuid) -> AppResult<()>;
    async fn list(&self, limit: u32, offset: u32) -> AppResult<Vec<User>>;
}

