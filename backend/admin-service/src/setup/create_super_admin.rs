use crate::domain::entities::User;
use crate::domain::repositories::{SetupRepository, UserRepository};
use crate::shared::AppResult;
use bcrypt::{hash, DEFAULT_COST};
use uuid::Uuid;

pub struct CreateSuperAdminUseCase {
    setup_repository: Box<dyn SetupRepository>,
    user_repository: Box<dyn UserRepository>,
}

impl CreateSuperAdminUseCase {
    pub fn new(
        setup_repository: Box<dyn SetupRepository>,
        user_repository: Box<dyn UserRepository>,
    ) -> Self {
        Self {
            setup_repository,
            user_repository,
        }
    }

    pub async fn execute(
        &self,
        email: &str,
        username: &str,
        password: &str,
        organization_id: Option<Uuid>,
    ) -> AppResult<User> {
        // Validate that setup hasn't been completed
        let is_completed = self.setup_repository.is_setup_completed().await?;
        if is_completed {
            return Err(crate::shared::AppError::Validation(
                "Setup has already been completed".to_string(),
            ));
        }

        // Validate inputs
        if email.trim().is_empty() || !email.contains('@') {
            return Err(crate::shared::AppError::Validation(
                "Invalid email address".to_string(),
            ));
        }

        if username.trim().is_empty() {
            return Err(crate::shared::AppError::Validation(
                "Username cannot be empty".to_string(),
            ));
        }

        if password.len() < 8 {
            return Err(crate::shared::AppError::Validation(
                "Password must be at least 8 characters long".to_string(),
            ));
        }

        // Check if user already exists
        if self.user_repository.find_by_email(email).await?.is_some() {
            return Err(crate::shared::AppError::Validation(
                "User with this email already exists".to_string(),
            ));
        }

        if self.user_repository.find_by_username(username).await?.is_some() {
            return Err(crate::shared::AppError::Validation(
                "User with this username already exists".to_string(),
            ));
        }

        // Hash password
        let password_hash = hash(password, DEFAULT_COST)
            .map_err(|e| crate::shared::AppError::Internal(format!("Failed to hash password: {}", e)))?;

        // Create super admin user
        let mut user = User::new_super_user(
            email.to_string(),
            username.to_string(),
            password_hash,
        );
        user.organization_id = organization_id;

        let created_user = self.user_repository.create(user).await?;

        // Mark setup as completed
        self.setup_repository
            .mark_setup_completed(Some(created_user.id))
            .await?;

        Ok(created_user)
    }
}

