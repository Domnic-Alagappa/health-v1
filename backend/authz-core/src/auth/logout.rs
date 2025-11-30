use shared::domain::repositories::RefreshTokenRepository;
use shared::AppResult;
use sha2::{Sha256, Digest};

pub struct LogoutUseCase {
    refresh_token_repository: Box<dyn RefreshTokenRepository>,
}

impl LogoutUseCase {
    pub fn new(refresh_token_repository: Box<dyn RefreshTokenRepository>) -> Self {
        Self {
            refresh_token_repository,
        }
    }

    pub async fn execute(&self, refresh_token: &str) -> AppResult<()> {
        // Hash the refresh token to look it up
        let mut hasher = Sha256::new();
        hasher.update(refresh_token.as_bytes());
        let token_hash = format!("{:x}", hasher.finalize());

        // Revoke the refresh token
        self.refresh_token_repository.revoke_token(&token_hash).await?;

        Ok(())
    }
}

