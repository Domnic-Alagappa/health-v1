use authz_core::dto::{RefreshTokenRequest, RefreshTokenResponse};
use shared::domain::repositories::{UserRepository, RefreshTokenRepository};
use authz_core::oidc::TokenManager;
use shared::AppResult;
use uuid::Uuid;
use chrono::{Utc, Duration};
use sha2::{Sha256, Digest};

pub struct RefreshTokenUseCase {
    user_repository: Box<dyn UserRepository>,
    refresh_token_repository: Box<dyn RefreshTokenRepository>,
    token_manager: TokenManager,
}

impl RefreshTokenUseCase {
    pub fn new(
        user_repository: Box<dyn UserRepository>,
        refresh_token_repository: Box<dyn RefreshTokenRepository>,
        token_manager: TokenManager,
    ) -> Self {
        Self {
            user_repository,
            refresh_token_repository,
            token_manager,
        }
    }

    pub async fn execute(&self, request: RefreshTokenRequest) -> AppResult<RefreshTokenResponse> {
        // Hash the refresh token to look it up in database
        let mut hasher = Sha256::new();
        hasher.update(request.refresh_token.as_bytes());
        let token_hash = format!("{:x}", hasher.finalize());

        // Find refresh token in database
        let refresh_token = self.refresh_token_repository
            .find_by_token_hash(&token_hash)
            .await?
            .ok_or_else(|| shared::AppError::Authentication("Invalid refresh token".to_string()))?;

        // Validate JWT token as well
        let claims = self.token_manager.validate_token(&request.refresh_token)?;
        let user_id = Uuid::parse_str(&claims.sub)
            .map_err(|_| shared::AppError::Authentication("Invalid token".to_string()))?;

        // Verify token belongs to user
        if refresh_token.user_id != user_id {
            return Err(shared::AppError::Authentication("Token mismatch".to_string()));
        }

        // Get user
        let user = self.user_repository
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| shared::AppError::Authentication("User not found".to_string()))?;

        // Check if user is active
        if !user.is_active {
            return Err(shared::AppError::Authentication("User account is inactive".to_string()));
        }

        // Revoke old refresh token
        self.refresh_token_repository.revoke_token(&token_hash).await?;

        // Generate new tokens
        let access_token = self.token_manager.generate_access_token(&user)?;
        let new_refresh_token_string = self.token_manager.generate_refresh_token(&user)?;

        // Hash new refresh token
        let mut hasher = Sha256::new();
        hasher.update(new_refresh_token_string.as_bytes());
        let new_token_hash = format!("{:x}", hasher.finalize());

        // Store new refresh token
        let new_refresh_token = shared::domain::repositories::refresh_token_repository::RefreshToken {
            id: Uuid::new_v4(),
            user_id: user.id,
            token_hash: new_token_hash,
            expires_at: Utc::now() + Duration::days(7),
            created_at: Utc::now(),
            revoked_at: None,
            is_revoked: false,
        };
        self.refresh_token_repository.create(new_refresh_token).await?;

        Ok(RefreshTokenResponse {
            access_token,
            refresh_token: new_refresh_token_string,
            expires_in: 3600,
        })
    }
}

