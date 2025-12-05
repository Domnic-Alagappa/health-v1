use async_trait::async_trait;
use crate::domain::entities::RequestLog;
use crate::shared::AppResult;
use uuid::Uuid;

#[async_trait]
pub trait RequestLogRepository: Send + Sync {
    async fn create(&self, log: RequestLog) -> AppResult<RequestLog>;
    async fn find_by_session(&self, session_id: Uuid, limit: u32) -> AppResult<Vec<RequestLog>>;
    async fn find_by_request_id(&self, request_id: &str) -> AppResult<Option<RequestLog>>;
}

