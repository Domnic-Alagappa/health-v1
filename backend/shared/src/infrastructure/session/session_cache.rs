use crate::domain::entities::Session;
use chrono::Utc;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

/// In-memory cache for active sessions
/// Provides fast access to session data without hitting the database
pub struct SessionCache {
    sessions: Arc<Mutex<HashMap<String, Session>>>,
}

impl SessionCache {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// Get session from cache by token
    pub fn get(&self, token: &str) -> Option<Session> {
        let sessions = self.sessions.lock().unwrap();
        sessions.get(token).cloned()
    }

    /// Store session in cache
    pub fn set(&self, token: &str, session: Session) {
        let mut sessions = self.sessions.lock().unwrap();
        sessions.insert(token.to_string(), session);
    }

    /// Remove session from cache
    pub fn remove(&self, token: &str) {
        let mut sessions = self.sessions.lock().unwrap();
        sessions.remove(token);
    }

    /// Remove session by ID (requires iterating through cache)
    pub fn remove_by_id(&self, id: Uuid) {
        let mut sessions = self.sessions.lock().unwrap();
        sessions.retain(|_, session| session.id != id);
    }

    /// Clean up expired sessions from cache
    pub fn cleanup_expired(&self) -> usize {
        let mut sessions = self.sessions.lock().unwrap();
        let now = Utc::now();
        let initial_size = sessions.len();
        sessions.retain(|_, session| {
            session.is_active && !session.is_expired() && session.expires_at > now
        });
        initial_size - sessions.len()
    }

    /// Get all active sessions (for debugging/admin purposes)
    pub fn get_all(&self) -> Vec<Session> {
        let sessions = self.sessions.lock().unwrap();
        sessions.values().cloned().collect()
    }

    /// Clear all sessions from cache
    pub fn clear(&self) {
        let mut sessions = self.sessions.lock().unwrap();
        sessions.clear();
    }
}

impl Default for SessionCache {
    fn default() -> Self {
        Self::new()
    }
}

