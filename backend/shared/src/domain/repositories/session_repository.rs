use async_trait::async_trait;
use crate::domain::entities::Session;
use crate::shared::AppResult;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[async_trait]
pub trait SessionRepository: Send + Sync {
    async fn create(&self, session: Session) -> AppResult<Session>;
    async fn find_by_token(&self, token: &str) -> AppResult<Option<Session>>;
    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Session>>;
    async fn find_active_by_user(&self, user_id: Uuid) -> AppResult<Vec<Session>>;
    async fn update(&self, session: Session) -> AppResult<Session>;
    async fn end_session(&self, id: Uuid, ended_at: DateTime<Utc>) -> AppResult<()>;
    async fn cleanup_expired(&self) -> AppResult<u64>;
}

