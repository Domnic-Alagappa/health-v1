use uuid::Uuid;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum::http::StatusCode;

/// Request context containing authenticated user information
#[derive(Debug, Clone)]
pub struct RequestContext {
    pub request_id: String,
    pub user_id: Uuid,
    pub email: String,
    pub role: Option<String>,
    pub permissions: Vec<String>,
}

impl RequestContext {
    pub fn new(
        request_id: String,
        user_id: Uuid,
        email: String,
        role: Option<String>,
        permissions: Vec<String>,
    ) -> Self {
        Self {
            request_id,
            user_id,
            email,
            role,
            permissions,
        }
    }
    
    /// Create audit context from request context
    pub fn to_audit_context(&self, system_id: Option<String>) -> crate::shared::AuditContext {
        crate::shared::AuditContext::new(
            Some(self.request_id.clone()),
            Some(self.user_id),
            system_id,
        )
    }

    /// Check if user has a specific permission
    pub fn has_permission(&self, permission: &str) -> bool {
        self.permissions.contains(&permission.to_string())
    }

    /// Check if user has any of the specified permissions
    pub fn has_any_permission(&self, permissions: &[&str]) -> bool {
        permissions.iter().any(|p| self.has_permission(p))
    }

    /// Check if user has all of the specified permissions
    pub fn has_all_permissions(&self, permissions: &[&str]) -> bool {
        permissions.iter().all(|p| self.has_permission(p))
    }

    /// Check if user has a specific role
    pub fn has_role(&self, role: &str) -> bool {
        self.role.as_ref().map(|r| r == role).unwrap_or(false)
    }
}

/// Extract RequestContext from Axum extensions
impl<S> FromRequestParts<S> for RequestContext
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, &'static str);

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        parts
            .extensions
            .get::<RequestContext>()
            .cloned()
            .ok_or((StatusCode::UNAUTHORIZED, "Request context not found"))
    }
}

