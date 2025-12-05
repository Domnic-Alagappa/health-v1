use crate::domain::entities::Session;
use crate::domain::repositories::SessionRepository;
use crate::infrastructure::database::DatabaseService;
use crate::shared::AppResult;
use async_trait::async_trait;
use chrono::{DateTime, Utc};
use std::sync::Arc;
use uuid::Uuid;

/// Temporary struct for database deserialization (with ip_address as String)
#[derive(Debug)]
struct SessionRow {
    id: Uuid,
    session_token: Option<String>,
    user_id: Option<Uuid>,
    organization_id: Option<Uuid>,
    ip_address_str: Option<String>,
    user_agent: Option<String>,
    started_at: DateTime<Utc>,
    authenticated_at: Option<DateTime<Utc>>,
    last_activity_at: DateTime<Utc>,
    expires_at: DateTime<Utc>,
    ended_at: Option<DateTime<Utc>>,
    is_active: bool,
    metadata: Option<serde_json::Value>,
    request_id: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
    created_by: Option<Uuid>,
    updated_by: Option<Uuid>,
    system_id: Option<String>,
    version: i64,
    app_type: Option<String>,
    app_device: Option<String>,
}

impl From<SessionRow> for Session {
    fn from(row: SessionRow) -> Self {
        // PostgreSQL INET type may include subnet mask (e.g., "127.0.0.1/32")
        // Extract just the IP address part
        let ip_str = row.ip_address_str.as_deref().expect("ip_address is NOT NULL");
        let ip_str = ip_str.split('/').next().unwrap_or(ip_str);
        let ip_address = ip_str.parse().unwrap_or_else(|_| {
            tracing::warn!("Failed to parse IP address: {}, using 127.0.0.1", ip_str);
            "127.0.0.1".parse().unwrap()
        });
        Session {
            id: row.id,
            session_token: row.session_token.expect("session_token is NOT NULL"),
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
            metadata: row.metadata.unwrap_or_else(|| serde_json::json!({})),
            request_id: row.request_id,
            created_at: row.created_at,
            updated_at: row.updated_at,
            created_by: row.created_by,
            updated_by: row.updated_by,
            system_id: row.system_id,
            version: row.version,
            app_type: row.app_type.expect("app_type is NOT NULL"),
            app_device: row.app_device.expect("app_device is NOT NULL"),
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
        let ip_address_str = session.ip_address.to_string();
        let row: SessionRow = sqlx::query_as!(
            SessionRow,
            r#"
            INSERT INTO sessions (
                id, session_token, user_id, organization_id, ip_address, user_agent,
                started_at, authenticated_at, last_activity_at, expires_at, ended_at,
                is_active, metadata, request_id, created_at, updated_at,
                created_by, updated_by, system_id, version, app_type, app_device
            )
            VALUES ($1, $2, $3, $4, $5::text::inet, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            RETURNING
                id, session_token, user_id, organization_id, ip_address::text as ip_address_str, user_agent,
                started_at, authenticated_at, last_activity_at, expires_at, ended_at,
                is_active, metadata, request_id, created_at, updated_at,
                created_by, updated_by, system_id, version, app_type, app_device
            "#,
            session.id,
            session.session_token,
            session.user_id,
            session.organization_id,
            ip_address_str,
            session.user_agent,
            session.started_at,
            session.authenticated_at,
            session.last_activity_at,
            session.expires_at,
            session.ended_at,
            session.is_active,
            Some(session.metadata),
            session.request_id,
            session.created_at,
            session.updated_at,
            session.created_by,
            session.updated_by,
            session.system_id,
            session.version,
            session.app_type,
            session.app_device
        )
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
        let row = sqlx::query_as!(
            SessionRow,
            r#"
            SELECT id, session_token, user_id, organization_id, ip_address::text as ip_address_str, user_agent,
                   started_at, authenticated_at, last_activity_at, expires_at, ended_at,
                   is_active, metadata, request_id, created_at, updated_at,
                   created_by, updated_by, system_id, version, app_type, app_device
            FROM sessions
            WHERE session_token = $1 AND is_active = true
            "#,
            token
        )
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
        let row = sqlx::query_as!(
            SessionRow,
            r#"
            SELECT id, session_token, user_id, organization_id, ip_address::text as ip_address_str, user_agent,
                   started_at, authenticated_at, last_activity_at, expires_at, ended_at,
                   is_active, metadata, request_id, created_at, updated_at,
                   created_by, updated_by, system_id, version, app_type, app_device
            FROM sessions
            WHERE id = $1
            "#,
            id
        )
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
        let rows = sqlx::query_as!(
            SessionRow,
            r#"
            SELECT id, session_token, user_id, organization_id, ip_address::text as ip_address_str, user_agent,
                   started_at, authenticated_at, last_activity_at, expires_at, ended_at,
                   is_active, metadata, request_id, created_at, updated_at,
                   created_by, updated_by, system_id, version, app_type, app_device
            FROM sessions
            WHERE user_id = $1 AND is_active = true
            ORDER BY last_activity_at DESC
            "#,
            user_id
        )
        .fetch_all(self.database_service.pool())
        .await
        .map_err(|e| {
            let err = crate::shared::AppError::Database(e);
            err.log_with_operation(location, "session_repository.find_active_by_user");
            err
        })?;
        Ok(rows.into_iter().map(|r| r.into()).collect())
    }

    async fn find_active_by_user_and_app(&self, user_id: Uuid, app_type: &str) -> AppResult<Vec<Session>> {
        let location = concat!(file!(), ":", line!());
        let rows = sqlx::query_as!(
            SessionRow,
            r#"
            SELECT id, session_token, user_id, organization_id, ip_address::text as ip_address_str, user_agent,
                   started_at, authenticated_at, last_activity_at, expires_at, ended_at,
                   is_active, metadata, request_id, created_at, updated_at,
                   created_by, updated_by, system_id, version, app_type, app_device
            FROM sessions
            WHERE user_id = $1 AND app_type = $2 AND is_active = true
            ORDER BY last_activity_at DESC
            "#,
            user_id,
            app_type
        )
        .fetch_all(self.database_service.pool())
        .await
        .map_err(|e| {
            let err = crate::shared::AppError::Database(e);
            err.log_with_operation(location, "session_repository.find_active_by_user_and_app");
            err
        })?;
        Ok(rows.into_iter().map(|r| r.into()).collect())
    }

    async fn update(&self, mut session: Session) -> AppResult<Session> {
        let location = concat!(file!(), ":", line!());
        let current_version = session.version;
        session.version += 1;
        session.updated_at = Utc::now();
        let ip_address_str = session.ip_address.to_string();

        let row: SessionRow = sqlx::query_as!(
            SessionRow,
            r#"
            UPDATE sessions
            SET session_token = $2, user_id = $3, organization_id = $4, ip_address = $5::text::inet,
                user_agent = $6, started_at = $7, authenticated_at = $8, last_activity_at = $9,
                expires_at = $10, ended_at = $11, is_active = $12, metadata = $13,
                request_id = $14, updated_at = $15, updated_by = $16, version = $17,
                app_type = $18, app_device = $19
            WHERE id = $1 AND version = $20
            RETURNING
                id, session_token, user_id, organization_id, ip_address::text as ip_address_str, user_agent,
                started_at, authenticated_at, last_activity_at, expires_at, ended_at,
                is_active, metadata, request_id, created_at, updated_at,
                created_by, updated_by, system_id, version, app_type, app_device
            "#,
            session.id,
            session.session_token,
            session.user_id,
            session.organization_id,
            ip_address_str,
            session.user_agent,
            session.started_at,
            session.authenticated_at,
            session.last_activity_at,
            session.expires_at,
            session.ended_at,
            session.is_active,
            Some(session.metadata),
            session.request_id,
            session.updated_at,
            session.updated_by,
            session.version,
            session.app_type,
            session.app_device,
            current_version
        )
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
        sqlx::query!(
            r#"
            UPDATE sessions
            SET ended_at = $2, is_active = false, updated_at = NOW(), version = version + 1
            WHERE id = $1
            "#,
            id,
            ended_at
        )
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
        let result = sqlx::query!(
            r#"
            UPDATE sessions
            SET ended_at = NOW(), is_active = false, updated_at = NOW(), version = version + 1
            WHERE is_active = true AND expires_at < NOW()
            "#,
        )
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

