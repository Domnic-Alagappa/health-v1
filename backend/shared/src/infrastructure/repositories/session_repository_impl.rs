use crate::domain::entities::Session;
use crate::domain::repositories::SessionRepository;
use crate::infrastructure::database::DatabaseService;
use crate::infrastructure::database::queries::sessions::*;
use crate::shared::AppResult;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use serde::Deserialize;
use sqlx::FromRow;
use std::net::IpAddr;
use std::sync::Arc;
use uuid::Uuid;

/// Temporary struct for database deserialization (with ip_address as String)
#[derive(Debug, FromRow)]
struct SessionRow {
    id: Uuid,
    session_token: String,
    user_id: Option<Uuid>,
    organization_id: Option<Uuid>,
    #[sqlx(rename = "ip_address_str")]
    ip_address: String,
    user_agent: Option<String>,
    started_at: DateTime<Utc>,
    authenticated_at: Option<DateTime<Utc>>,
    last_activity_at: DateTime<Utc>,
    expires_at: DateTime<Utc>,
    ended_at: Option<DateTime<Utc>>,
    is_active: bool,
    metadata: serde_json::Value,
    request_id: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    created_by: Option<Uuid>,
    updated_by: Option<Uuid>,
    system_id: Option<String>,
    version: i64,
}

impl From<SessionRow> for Session {
    fn from(row: SessionRow) -> Self {
        // PostgreSQL INET type may include subnet mask (e.g., "127.0.0.1/32")
        // Extract just the IP address part
        let ip_str = row.ip_address.split('/').next().unwrap_or(&row.ip_address);
        let ip_address = ip_str.parse().unwrap_or_else(|_| {
            tracing::warn!("Failed to parse IP address: {}, using 127.0.0.1", ip_str);
            "127.0.0.1".parse().unwrap()
        });
        Session {
            id: row.id,
            session_token: row.session_token,
            user_id: row.user_id,
            organization_id: row.organization_id,
            ip_address,
            user_agent: row.user_agent,
            started_at: row.started_at,
            authenticated_at: row.authenticated_at,
            last_activity_at: row.last_activity_at,
            expires_at: row.expires_at,
            ended_at: row.ended_at,
            is_active: row.is_active,
            metadata: row.metadata,
            request_id: row.request_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            created_by: row.created_by,
            updated_by: row.updated_by,
            system_id: row.system_id,
            version: row.version,
        }
    }
}

pub struct SessionRepositoryImpl {
    database_service: Arc<DatabaseService>,
}

impl SessionRepositoryImpl {
    pub fn new(database_service: Arc<DatabaseService>) -> Self {
        Self { database_service }
    }
}

#[async_trait]
impl SessionRepository for SessionRepositoryImpl {
    async fn create(&self, session: Session) -> AppResult<Session> {
        let location = concat!(file!(), ":", line!());
        let row: SessionRow = sqlx::query_as::<_, SessionRow>(SESSION_INSERT)
            .bind(session.id)
            .bind(&session.session_token)
            .bind(session.user_id)
            .bind(session.organization_id)
            .bind(session.ip_address.to_string())
            .bind(session.user_agent.as_ref())
            .bind(session.started_at)
            .bind(session.authenticated_at)
            .bind(session.last_activity_at)
            .bind(session.expires_at)
            .bind(session.ended_at)
            .bind(session.is_active)
            .bind(&session.metadata)
            .bind(session.request_id.as_ref())
            .bind(session.created_at)
            .bind(session.updated_at)
            .bind(session.created_by)
            .bind(session.updated_by)
            .bind(session.system_id.as_ref())
            .bind(session.version)
            .fetch_one(self.database_service.pool())
            .await
            .map_err(|e| {
                let err = crate::shared::AppError::Database(e);
                err.log_with_operation(location, "session_repository.create");
                err
            })?;
        Ok(row.into())
    }

    async fn find_by_token(&self, token: &str) -> AppResult<Option<Session>> {
        let location = concat!(file!(), ":", line!());
        let row = sqlx::query_as::<_, SessionRow>(SESSION_FIND_BY_TOKEN)
            .bind(token)
            .fetch_optional(self.database_service.pool())
            .await
            .map_err(|e| {
                let err = crate::shared::AppError::Database(e);
                err.log_with_operation(location, "session_repository.find_by_token");
                err
            })?;
        Ok(row.map(|r| r.into()))
    }

    async fn find_by_id(&self, id: Uuid) -> AppResult<Option<Session>> {
        let location = concat!(file!(), ":", line!());
        let row = sqlx::query_as::<_, SessionRow>(SESSION_FIND_BY_ID)
            .bind(id)
            .fetch_optional(self.database_service.pool())
            .await
            .map_err(|e| {
                let err = crate::shared::AppError::Database(e);
                err.log_with_operation(location, "session_repository.find_by_id");
                err
            })?;
        Ok(row.map(|r| r.into()))
    }

    async fn find_active_by_user(&self, user_id: Uuid) -> AppResult<Vec<Session>> {
        let location = concat!(file!(), ":", line!());
        let rows = sqlx::query_as::<_, SessionRow>(SESSION_FIND_ACTIVE_BY_USER)
            .bind(user_id)
            .fetch_all(self.database_service.pool())
            .await
            .map_err(|e| {
                let err = crate::shared::AppError::Database(e);
                err.log_with_operation(location, "session_repository.find_active_by_user");
                err
            })?;
        Ok(rows.into_iter().map(|r| r.into()).collect())
    }

    async fn update(&self, mut session: Session) -> AppResult<Session> {
        let location = concat!(file!(), ":", line!());
        let current_version = session.version;
        session.version += 1;
        session.updated_at = Utc::now();

        let row: SessionRow = sqlx::query_as::<_, SessionRow>(SESSION_UPDATE)
            .bind(session.id)
            .bind(&session.session_token)
            .bind(session.user_id)
            .bind(session.organization_id)
            .bind(session.ip_address.to_string())
            .bind(session.user_agent.as_ref())
            .bind(session.started_at)
            .bind(session.authenticated_at)
            .bind(session.last_activity_at)
            .bind(session.expires_at)
            .bind(session.ended_at)
            .bind(session.is_active)
            .bind(&session.metadata)
            .bind(session.request_id.as_ref())
            .bind(session.updated_at)
            .bind(session.updated_by)
            .bind(session.version)
            .bind(current_version)
            .fetch_one(self.database_service.pool())
            .await
            .map_err(|e| {
                let err = crate::shared::AppError::Database(e);
                err.log_with_operation(location, "session_repository.update");
                err
            })?;
        Ok(row.into())
    }

    async fn end_session(&self, id: Uuid, ended_at: DateTime<Utc>) -> AppResult<()> {
        let location = concat!(file!(), ":", line!());
        sqlx::query(SESSION_END)
            .bind(id)
            .bind(ended_at)
            .execute(self.database_service.pool())
            .await
            .map_err(|e| {
                let err = crate::shared::AppError::Database(e);
                err.log_with_operation(location, "session_repository.end_session");
                err
            })?;
        Ok(())
    }

    async fn cleanup_expired(&self) -> AppResult<u64> {
        let location = concat!(file!(), ":", line!());
        let result = sqlx::query(SESSION_CLEANUP_EXPIRED)
            .execute(self.database_service.pool())
            .await
            .map_err(|e| {
                let err = crate::shared::AppError::Database(e);
                err.log_with_operation(location, "session_repository.cleanup_expired");
                err
            })?;
        Ok(result.rows_affected())
    }
}

