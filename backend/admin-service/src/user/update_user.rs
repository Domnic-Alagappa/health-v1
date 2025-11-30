use crate::application::dto::{UpdateUserRequest, UserResponse};
use crate::domain::repositories::UserRepository;
use crate::shared::AppResult;
use uuid::Uuid;
use bcrypt::{hash, DEFAULT_COST};

pub struct UpdateUserUseCase {
    user_repository: Box<dyn UserRepository>,
}

impl UpdateUserUseCase {
    pub fn new(user_repository: Box<dyn UserRepository>) -> Self {
        Self { user_repository }
    }

    pub async fn execute(&self, user_id: Uuid, request: UpdateUserRequest) -> AppResult<UserResponse> {
        let mut user = self.user_repository
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| crate::shared::AppError::NotFound("User not found".to_string()))?;

        // Update fields if provided
        if let Some(email) = request.email {
            // Check if email is already taken
            if let Some(existing) = self.user_repository.find_by_email(&email).await? {
                if existing.id != user_id {
                    return Err(crate::shared::AppError::Validation("Email already in use".to_string()));
                }
            }
            user.email = email;
        }

        if let Some(username) = request.username {
            // Check if username is already taken
            if let Some(existing) = self.user_repository.find_by_username(&username).await? {
                if existing.id != user_id {
                    return Err(crate::shared::AppError::Validation("Username already in use".to_string()));
                }
            }
            user.username = username;
        }

        if let Some(password) = request.password {
            let password_hash = hash(&password, DEFAULT_COST)
                .map_err(|e| crate::shared::AppError::Internal(format!("Password hashing failed: {}", e)))?;
            user.password_hash = password_hash;
        }

        user.updated_at = chrono::Utc::now();
        let updated_user = self.user_repository.update(user).await?;

        Ok(UserResponse::from(updated_user))
    }
}

