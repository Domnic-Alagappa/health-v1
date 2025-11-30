use authz_core::dto::UserInfoResponse;
use authz_core::authorization::GetUserPermissionsUseCase;
use shared::domain::repositories::UserRepository;
use shared::AppResult;
use uuid::Uuid;

pub struct UserInfoUseCase {
    user_repository: Box<dyn UserRepository>,
    get_permissions_use_case: GetUserPermissionsUseCase,
}

impl UserInfoUseCase {
    pub fn new(
        user_repository: Box<dyn UserRepository>,
        get_permissions_use_case: GetUserPermissionsUseCase,
    ) -> Self {
        Self {
            user_repository,
            get_permissions_use_case,
        }
    }

    pub async fn execute(&self, user_id: Uuid) -> AppResult<UserInfoResponse> {
        let user = self.user_repository
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| shared::AppError::NotFound("User not found".to_string()))?;

        let (role, permissions) = self.get_permissions_use_case.execute(user_id).await?;

        Ok(UserInfoResponse {
            sub: user.id.to_string(),
            email: user.email,
            name: Some(user.username),
            role: if role.is_empty() { None } else { Some(role) },
            permissions: if permissions.is_empty() { None } else { Some(permissions) },
        })
    }
}

