use crate::domain::entities::Session;
use crate::domain::repositories::SessionRepository;
use crate::infrastructure::session::SessionCache;
use crate::shared::AppResult;
use chrono::{Duration, Utc};
use std::net::IpAddr;
use std::sync::Arc;
use uuid::Uuid;

/// Service for managing session lifecycle
pub struct SessionService {
    repository: Arc<dyn SessionRepository>,
    cache: Arc<SessionCache>,
    session_ttl_hours: i64,
}

impl SessionService {
    pub fn new(
        repository: Arc<dyn SessionRepository>,
        cache: Arc<SessionCache>,
        session_ttl_hours: i64,
    ) -> Self {
        Self {
            repository,
            cache,
            session_ttl_hours,
        }
    }

    /// Create or get existing session by token
    /// If session exists and is active, return it. Otherwise create a new one.
    pub async fn create_or_get_session(
        &self,
        session_token: &str,
        ip: IpAddr,
        user_agent: Option<&str>,
    ) -> AppResult<Session> {
        // Try cache first
        if let Some(session) = self.cache.get(session_token) {
            if session.is_active && !session.is_expired() {
                return Ok(session);
            }
        }

        // Try database
        if let Some(session) = self.repository.find_by_token(session_token).await? {
            if session.is_active && !session.is_expired() {
                // Update activity and cache
                let mut session = session;
                session.update_activity();
                let updated = self.repository.update(session.clone()).await?;
                let token = updated.session_token.clone();
                self.cache.set(&token, updated.clone());
                return Ok(updated);
            }
        }

        // Create new session
        let expires_at = Utc::now() + Duration::hours(self.session_ttl_hours);
        let session = Session::new(
            session_token.to_string(),
            ip,
            user_agent.map(|s| s.to_string()),
            expires_at,
        );

        let created = self.repository.create(session.clone()).await?;
        self.cache.set(session_token, created.clone());
        Ok(created)
    }

    /// Authenticate a session (link user to ghost session)
    pub async fn authenticate_session(
        &self,
        session_id: Uuid,
        user_id: Uuid,
        organization_id: Option<Uuid>,
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

        session.authenticate(user_id, organization_id);
        let updated = self.repository.update(session.clone()).await?;
        let session_token = updated.session_token.clone();
        self.cache.set(&session_token, updated.clone());
        Ok(updated)
    }

    /// Update session activity timestamp
    pub async fn update_activity(&self, session_id: Uuid) -> AppResult<()> {
        let mut session = self
            .repository
            .find_by_id(session_id)
            .await?
            .ok_or_else(|| {
                crate::shared::AppError::NotFound(format!("Session {} not found", session_id))
            })?;

        if !session.is_active || session.is_expired() {
            return Ok(()); // Don't update inactive/expired sessions
        }

        session.update_activity();
        let updated = self.repository.update(session.clone()).await?;
        let session_token = updated.session_token.clone();
        self.cache.set(&session_token, updated.clone());
        Ok(())
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

