use crate::application::dto::{CreateUserRequest, UserResponse};
use crate::domain::entities::User;
use crate::domain::repositories::UserRepository;
use crate::shared::AppResult;
use bcrypt::{hash, DEFAULT_COST};

pub struct CreateUserUseCase {
    user_repository: Box<dyn UserRepository>,
}

impl CreateUserUseCase {
    pub fn new(user_repository: Box<dyn UserRepository>) -> Self {
        Self { user_repository }
    }

    pub async fn execute(&self, request: CreateUserRequest) -> AppResult<UserResponse> {
        // Check if user already exists
        if self.user_repository.find_by_email(&request.email).await?.is_some() {
            return Err(crate::shared::AppError::Validation("User with this email already exists".to_string()));
        }

        if self.user_repository.find_by_username(&request.username).await?.is_some() {
            return Err(crate::shared::AppError::Validation("User with this username already exists".to_string()));
        }

        // Hash password
        let password_hash = hash(&request.password, DEFAULT_COST)
            .map_err(|e| crate::shared::AppError::Internal(format!("Password hashing failed: {}", e)))?;

        // Create user
        let user = User::new(request.email, request.username, password_hash);
        let created_user = self.user_repository.create(user).await?;

        Ok(UserResponse::from(created_user))
    }
}

