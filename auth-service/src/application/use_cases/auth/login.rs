use crate::application::dto::{LoginRequest, LoginResponse};
use crate::domain::repositories::UserRepository;
use crate::domain::services::AuthService;
use crate::infrastructure::oidc::TokenManager;
use crate::shared::AppResult;
use bcrypt::{hash, verify, DEFAULT_COST};

pub struct LoginUseCase {
    user_repository: Box<dyn UserRepository>,
    token_manager: TokenManager,
}

impl LoginUseCase {
    pub fn new(user_repository: Box<dyn UserRepository>, token_manager: TokenManager) -> Self {
        Self {
            user_repository,
            token_manager,
        }
    }

    pub async fn execute(&self, request: LoginRequest) -> AppResult<LoginResponse> {
        // Find user by username
        let user = self.user_repository
            .find_by_username(&request.username)
            .await?
            .ok_or_else(|| crate::shared::AppError::Authentication("Invalid credentials".to_string()))?;

        // Verify password
        if !verify(&request.password, &user.password_hash)
            .map_err(|_| crate::shared::AppError::Authentication("Password verification failed".to_string()))? {
            return Err(crate::shared::AppError::Authentication("Invalid credentials".to_string()));
        }

        // Check if user is active
        if !user.is_active {
            return Err(crate::shared::AppError::Authentication("User account is inactive".to_string()));
        }

        // Generate tokens
        let access_token = self.token_manager.generate_access_token(&user)?;
        let refresh_token = self.token_manager.generate_refresh_token(&user)?;

        // Update last login
        let mut updated_user = user;
        updated_user.record_login();
        self.user_repository.update(updated_user).await?;

        Ok(LoginResponse {
            access_token,
            refresh_token,
            token_type: "Bearer".to_string(),
            expires_in: 3600,
        })
    }
}

