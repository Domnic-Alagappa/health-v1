use crate::shared::AppResult;

pub struct LogoutUseCase {
    // Token revocation would be implemented here
}

impl LogoutUseCase {
    pub fn new() -> Self {
        Self {}
    }

    pub async fn execute(&self, _token: &str) -> AppResult<()> {
        // TODO: Implement token revocation
        Ok(())
    }
}

