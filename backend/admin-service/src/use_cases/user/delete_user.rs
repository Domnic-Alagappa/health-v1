use shared::domain::repositories::UserRepository;
use shared::AppResult;
use uuid::Uuid;

pub struct DeleteUserUseCase {
    user_repository: Box<dyn UserRepository>,
}

impl DeleteUserUseCase {
    pub fn new(user_repository: Box<dyn UserRepository>) -> Self {
        Self { user_repository }
    }

    pub async fn execute(&self, user_id: Uuid) -> AppResult<()> {
        // Check if user exists
        self.user_repository
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| crate::shared::AppError::NotFound("User not found".to_string()))?;

        // Delete user
        self.user_repository.delete(user_id).await?;
        Ok(())
    }
}

