use crate::application::dto::{RefreshTokenRequest, RefreshTokenResponse};
use crate::domain::repositories::UserRepository;
use crate::infrastructure::oidc::TokenManager;
use crate::shared::AppResult;
use uuid::Uuid;

pub struct RefreshTokenUseCase {
    user_repository: Box<dyn UserRepository>,
    token_manager: TokenManager,
}

impl RefreshTokenUseCase {
    pub fn new(user_repository: Box<dyn UserRepository>, token_manager: TokenManager) -> Self {
        Self {
            user_repository,
            token_manager,
        }
    }

    pub async fn execute(&self, request: RefreshTokenRequest) -> AppResult<RefreshTokenResponse> {
        // Validate refresh token
        let claims = self.token_manager.validate_token(&request.refresh_token)?;

        // Get user
        let user_id = Uuid::parse_str(&claims.sub)
            .map_err(|_| crate::shared::AppError::Authentication("Invalid token".to_string()))?;
        
        let user = self.user_repository
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| crate::shared::AppError::Authentication("User not found".to_string()))?;

        // Generate new tokens
        let access_token = self.token_manager.generate_access_token(&user)?;
        let refresh_token = self.token_manager.generate_refresh_token(&user)?;

        Ok(RefreshTokenResponse {
            access_token,
            refresh_token,
            expires_in: 3600,
        })
    }
}

