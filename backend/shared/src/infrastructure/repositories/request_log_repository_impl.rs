use crate::domain::entities::RequestLog;
use crate::domain::repositories::RequestLogRepository;
use crate::infrastructure::database::DatabaseService;
use crate::infrastructure::database::queries::request_logs::*;
use crate::shared::AppResult;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::FromRow;
use std::sync::Arc;
use uuid::Uuid;

/// Temporary struct for database deserialization (with ip_address as String)
#[derive(Debug, FromRow)]
struct RequestLogRow {
    id: Uuid,
    session_id: Uuid,
    request_id: String,
    user_id: Option<Uuid>,
    method: String,
    path: String,
    query_string: Option<String>,
    #[sqlx(rename = "ip_address_str")]
    ip_address: String,
    user_agent: Option<String>,
    status_code: i32,
    response_time_ms: Option<i32>,
    request_size_bytes: Option<i32>,
    response_size_bytes: Option<i32>,
    created_at: DateTime<Utc>,
    metadata: serde_json::Value,
}

impl From<RequestLogRow> for RequestLog {
    fn from(row: RequestLogRow) -> Self {
        // PostgreSQL INET type may include subnet mask (e.g., "127.0.0.1/32")
        // Extract just the IP address part
        let ip_str = row.ip_address.split('/').next().unwrap_or(&row.ip_address);
        let ip_address = ip_str.parse().unwrap_or_else(|_| {
            tracing::warn!("Failed to parse IP address: {}, using 127.0.0.1", ip_str);
            "127.0.0.1".parse().unwrap()
        });
        RequestLog {
            id: row.id,
            session_id: row.session_id,
            request_id: row.request_id,
            user_id: row.user_id,
            method: row.method,
            path: row.path,
            query_string: row.query_string,
            ip_address,
            user_agent: row.user_agent,
            status_code: row.status_code,
            response_time_ms: row.response_time_ms,
            request_size_bytes: row.request_size_bytes,
            response_size_bytes: row.response_size_bytes,
            created_at: row.created_at,
            metadata: row.metadata,
        }
    }
}

pub struct RequestLogRepositoryImpl {
    database_service: Arc<DatabaseService>,
}

impl RequestLogRepositoryImpl {
    pub fn new(database_service: Arc<DatabaseService>) -> Self {
        Self { database_service }
    }
}

#[async_trait]
impl RequestLogRepository for RequestLogRepositoryImpl {
    async fn create(&self, log: RequestLog) -> AppResult<RequestLog> {
        let location = concat!(file!(), ":", line!());
        let row: RequestLogRow = sqlx::query_as::<_, RequestLogRow>(REQUEST_LOG_INSERT)
            .bind(log.id)
            .bind(log.session_id)
            .bind(&log.request_id)
            .bind(log.user_id)
            .bind(&log.method)
            .bind(&log.path)
            .bind(log.query_string.as_ref())
            .bind(log.ip_address.to_string())
            .bind(log.user_agent.as_ref())
            .bind(log.status_code)
            .bind(log.response_time_ms)
            .bind(log.request_size_bytes)
            .bind(log.response_size_bytes)
            .bind(log.created_at)
            .bind(&log.metadata)
            .fetch_one(self.database_service.pool())
            .await
            .map_err(|e| {
                let err = crate::shared::AppError::Database(e);
                err.log_with_operation(location, "request_log_repository.create");
                err
            })?;
        Ok(row.into())
    }

    async fn find_by_session(&self, session_id: Uuid, limit: u32) -> AppResult<Vec<RequestLog>> {
        let location = concat!(file!(), ":", line!());
        let rows = sqlx::query_as::<_, RequestLogRow>(REQUEST_LOG_FIND_BY_SESSION)
            .bind(session_id)
            .bind(limit as i64)
            .fetch_all(self.database_service.pool())
            .await
            .map_err(|e| {
                let err = crate::shared::AppError::Database(e);
                err.log_with_operation(location, "request_log_repository.find_by_session");
                err
            })?;
        Ok(rows.into_iter().map(|r| r.into()).collect())
    }

    async fn find_by_request_id(&self, request_id: &str) -> AppResult<Option<RequestLog>> {
        let location = concat!(file!(), ":", line!());
        let row = sqlx::query_as::<_, RequestLogRow>(REQUEST_LOG_FIND_BY_REQUEST_ID)
            .bind(request_id)
            .fetch_optional(self.database_service.pool())
            .await
            .map_err(|e| {
                let err = crate::shared::AppError::Database(e);
                err.log_with_operation(location, "request_log_repository.find_by_request_id");
                err
            })?;
        Ok(row.map(|r| r.into()))
    }
}

