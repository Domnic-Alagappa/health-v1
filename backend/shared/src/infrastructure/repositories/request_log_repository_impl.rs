use crate::domain::entities::RequestLog;
use crate::domain::repositories::RequestLogRepository;
use crate::infrastructure::database::DatabaseService;
use crate::shared::AppResult;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use std::sync::Arc;
use uuid::Uuid;

/// Temporary struct for database deserialization (with ip_address as String)
/// Note: Field names must match SQL aliases exactly for compile-time macros
#[derive(Debug)]
struct RequestLogRow {
    id: Uuid,
    session_id: Uuid,
    request_id: Option<String>,
    user_id: Option<Uuid>,
    method: Option<String>,
    path: Option<String>,
    query_string: Option<String>,
    ip_address_str: Option<String>,
    user_agent: Option<String>,
    status_code: i32,
    response_time_ms: Option<i32>,
    request_size_bytes: Option<i32>,
    response_size_bytes: Option<i32>,
    created_at: DateTime<Utc>,
    metadata: Option<serde_json::Value>,
}

impl From<RequestLogRow> for RequestLog {
    fn from(row: RequestLogRow) -> Self {
        // PostgreSQL INET type may include subnet mask (e.g., "127.0.0.1/32")
        // Extract just the IP address part
        let ip_str = row.ip_address_str.as_deref().expect("ip_address is NOT NULL");
        let ip_str = ip_str.split('/').next().unwrap_or(ip_str);
        let ip_address = ip_str.parse().unwrap_or_else(|_| {
            tracing::warn!("Failed to parse IP address: {}, using 127.0.0.1", ip_str);
            "127.0.0.1".parse().unwrap()
        });
        RequestLog {
            id: row.id,
            session_id: row.session_id,
            request_id: row.request_id.expect("request_id is NOT NULL"),
            user_id: row.user_id,
            method: row.method.expect("method is NOT NULL"),
            path: row.path.expect("path is NOT NULL"),
            query_string: row.query_string,
            ip_address,
            user_agent: row.user_agent,
            status_code: row.status_code,
            response_time_ms: row.response_time_ms,
            request_size_bytes: row.request_size_bytes,
            response_size_bytes: row.response_size_bytes,
            created_at: row.created_at,
            metadata: row.metadata.unwrap_or_else(|| serde_json::json!({})),
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
        let ip_address_str = log.ip_address.to_string();
        let row: RequestLogRow = sqlx::query_as!(
            RequestLogRow,
            r#"
            INSERT INTO request_logs (
                id, session_id, request_id, user_id, method, path, query_string,
                ip_address, user_agent, status_code, response_time_ms,
                request_size_bytes, response_size_bytes, created_at, metadata
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8::text::inet, $9, $10, $11, $12, $13, $14, $15)
            RETURNING
                id, session_id, request_id, user_id, method, path, query_string,
                ip_address::text as ip_address_str, user_agent, status_code, response_time_ms,
                request_size_bytes, response_size_bytes, created_at, metadata
            "#,
            log.id,
            log.session_id,
            log.request_id,
            log.user_id,
            log.method,
            log.path,
            log.query_string,
            ip_address_str,
            log.user_agent,
            log.status_code,
            log.response_time_ms,
            log.request_size_bytes,
            log.response_size_bytes,
            log.created_at,
            Some(log.metadata)
        )
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
        let limit_i64 = limit as i64;
        let rows = sqlx::query_as!(
            RequestLogRow,
            r#"
            SELECT id, session_id, request_id, user_id, method, path, query_string,
                   ip_address::text as ip_address_str, user_agent, status_code, response_time_ms,
                   request_size_bytes, response_size_bytes, created_at, metadata
            FROM request_logs
            WHERE session_id = $1
            ORDER BY created_at DESC
            LIMIT $2
            "#,
            session_id,
            limit_i64
        )
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
        let row = sqlx::query_as!(
            RequestLogRow,
            r#"
            SELECT id, session_id, request_id, user_id, method, path, query_string,
                   ip_address::text as ip_address_str, user_agent, status_code, response_time_ms,
                   request_size_bytes, response_size_bytes, created_at, metadata
            FROM request_logs
            WHERE request_id = $1
            ORDER BY created_at DESC
            LIMIT 1
            "#,
            request_id
        )
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

