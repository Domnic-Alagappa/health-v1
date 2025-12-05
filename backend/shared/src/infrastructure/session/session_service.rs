use crate::domain::entities::Session;
use crate::domain::repositories::SessionRepository;
use crate::infrastructure::session::SessionCache;
use crate::shared::AppResult;
use crate::config::settings::SessionConfig;
use chrono::{Duration, Utc};
use std::net::IpAddr;
use std::sync::Arc;
use uuid::Uuid;

/// Service for managing session lifecycle
pub struct SessionService {
    repository: Arc<dyn SessionRepository>,
    cache: Arc<SessionCache>,
    session_config: SessionConfig,
}

impl SessionService {
    pub fn new(
        repository: Arc<dyn SessionRepository>,
        cache: Arc<SessionCache>,
        session_config: SessionConfig,
    ) -> Self {
        Self {
            repository,
            cache,
            session_config,
        }
    }

    /// Get TTL hours for a specific app type
    fn get_ttl_hours(&self, app_type: &str) -> i64 {
        match app_type {
            "admin-ui" => self.session_config.admin_ui_ttl_hours as i64,
            "client-ui" => self.session_config.client_ui_ttl_hours as i64,
            "api" => self.session_config.api_ttl_hours as i64,
            _ => self.session_config.api_ttl_hours as i64, // Default to API TTL
        }
    }

    /// Create or get existing session by token
    /// If session exists and is active, return it. Otherwise create a new one.
    pub async fn create_or_get_session(
        &self,
        session_token: &str,
        ip: IpAddr,
        user_agent: Option<&str>,
        app_type: &str,
        app_device: &str,
    ) -> AppResult<Session> {
        // Try cache first
        if let Some(session) = self.cache.get(session_token) {
            if session.is_active && !session.is_expired() {
                // If app_type or app_device changed, update the session
                if session.app_type != app_type || session.app_device != app_device {
                    let mut updated_session = session;
                    updated_session.app_type = app_type.to_string();
                    updated_session.app_device = app_device.to_string();
                    let saved = self.repository.update(updated_session.clone()).await?;
                    let token = saved.session_token.clone();
                    self.cache.set(&token, saved.clone());
                    return Ok(saved);
                }
                return Ok(session);
            }
        }

        // Try database
        if let Some(session) = self.repository.find_by_token(session_token).await? {
            if session.is_active && !session.is_expired() {
                // If app_type or app_device changed, update the session
                let mut session = session;
                if session.app_type != app_type || session.app_device != app_device {
                    session.app_type = app_type.to_string();
                    session.app_device = app_device.to_string();
                }
                session.update_activity();
                let updated = self.repository.update(session.clone()).await?;
                let token = updated.session_token.clone();
                self.cache.set(&token, updated.clone());
                return Ok(updated);
            }
        }

        // Create new session with app-specific TTL
        let ttl_hours = self.get_ttl_hours(app_type);
        let expires_at = Utc::now() + Duration::hours(ttl_hours);
        let session = Session::new(
            session_token.to_string(),
            ip,
            user_agent.map(|s| s.to_string()),
            expires_at,
            app_type.to_string(),
            app_device.to_string(),
        );

        let created = self.repository.create(session.clone()).await?;
        self.cache.set(session_token, created.clone());
        Ok(created)
    }

    /// Authenticate a session (link user to ghost session)
    /// Optionally update app_type and app_device if provided
    pub async fn authenticate_session(
        &self,
        session_id: Uuid,
        user_id: Uuid,
        organization_id: Option<Uuid>,
        app_type: Option<&str>,
        app_device: Option<&str>,
    ) -> AppResult<Session> {
        let mut session = self
            .repository
            .find_by_id(session_id)
            .await?
            .ok_or_else(|| {
                crate::shared::AppError::NotFound(format!("Session {} not found", session_id))
            })?;

        if !session.is_active {
            return Err(crate::shared::AppError::Validation(
                "Session is not active".to_string(),
            ));
        }

        if session.is_expired() {
            return Err(crate::shared::AppError::Validation(
                "Session has expired".to_string(),
            ));
        }

        // Update app_type and app_device if provided
        if let Some(app_type_val) = app_type {
            session.app_type = app_type_val.to_string();
        }
        if let Some(app_device_val) = app_device {
            session.app_device = app_device_val.to_string();
        }

        session.authenticate(user_id, organization_id);
        
        // Try to update - handle optimistic locking race conditions gracefully
        match self.repository.update(session.clone()).await {
            Ok(updated) => {
                let session_token = updated.session_token.clone();
                self.cache.set(&session_token, updated.clone());
                Ok(updated)
            }
            Err(e) => {
                // Check if it's a "no rows" error (version mismatch - race condition)
                if let crate::shared::AppError::Database(db_err) = &e {
                    if matches!(db_err, sqlx::Error::RowNotFound)
                        || db_err.to_string().contains("no rows returned")
                    {
                        // Race condition: session was updated concurrently
                        // Try to fetch the updated session and return it
                        if let Ok(Some(updated_session)) = self.repository.find_by_id(session_id).await {
                            let session_token = updated_session.session_token.clone();
                            self.cache.set(&session_token, updated_session.clone());
                            return Ok(updated_session);
                        }
                    }
                }
                // For other errors, propagate them
                Err(e)
            }
        }
    }

    /// Update session activity timestamp
    /// This is a best-effort operation that handles race conditions gracefully
    pub async fn update_activity(&self, session_id: Uuid) -> AppResult<()> {
        // Try to find the session - if it doesn't exist, that's okay (might have been deleted)
        let mut session = match self.repository.find_by_id(session_id).await? {
            Some(s) => s,
            None => {
                // Session doesn't exist - this is fine for background updates
                return Ok(());
            }
        };

        if !session.is_active || session.is_expired() {
            return Ok(()); // Don't update inactive/expired sessions
        }

        session.update_activity();
        
        // Try to update - if it fails due to version mismatch or session not found,
        // that's okay (race condition with another request)
        match self.repository.update(session.clone()).await {
            Ok(updated) => {
                let session_token = updated.session_token.clone();
                self.cache.set(&session_token, updated.clone());
                Ok(())
            }
            Err(e) => {
                // Check if it's a "no rows" error (version mismatch or session deleted)
                // This happens when the WHERE clause (id + version) doesn't match any rows
                if let crate::shared::AppError::Database(db_err) = &e {
                    // Check for RowNotFound variant or error message containing "no rows"
                    if matches!(db_err, sqlx::Error::RowNotFound) 
                        || db_err.to_string().contains("no rows returned") {
                        // This is expected in race conditions - just return Ok
                        return Ok(());
                    }
                }
                // For other errors, propagate them
                Err(e)
            }
        }
    }

    /// End a session (logout or timeout)
    pub async fn end_session(&self, session_id: Uuid) -> AppResult<()> {
        let session = self
            .repository
            .find_by_id(session_id)
            .await?
            .ok_or_else(|| {
                crate::shared::AppError::NotFound(format!("Session {} not found", session_id))
            })?;

        self.repository.end_session(session_id, Utc::now()).await?;
        self.cache.remove(&session.session_token);
        Ok(())
    }

    /// Get active session by token
    pub async fn get_active_session(&self, token: &str) -> AppResult<Option<Session>> {
        // Try cache first
        if let Some(session) = self.cache.get(token) {
            if session.is_active && !session.is_expired() {
                return Ok(Some(session));
            }
        }

        // Try database
        if let Some(session) = self.repository.find_by_token(token).await? {
            if session.is_active && !session.is_expired() {
                self.cache.set(token, session.clone());
                return Ok(Some(session));
            }
        }

        Ok(None)
    }

    /// Cleanup expired sessions (should be called periodically)
    pub async fn cleanup_expired(&self) -> AppResult<u64> {
        let count = self.repository.cleanup_expired().await?;
        self.cache.cleanup_expired();
        Ok(count)
    }
}

