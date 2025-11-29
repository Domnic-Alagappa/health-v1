use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserRequest {
    pub email: String,
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateUserRequest {
    pub email: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub is_active: bool,
    pub is_verified: bool,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

impl From<crate::domain::entities::User> for UserResponse {
    fn from(user: crate::domain::entities::User) -> Self {
        Self {
            id: user.id,
            email: user.email,
            username: user.username,
            is_active: user.is_active,
            is_verified: user.is_verified,
            created_at: user.created_at,
        }
    }
}

