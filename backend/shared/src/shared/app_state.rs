use std::sync::Arc;
use sqlx::PgPool;
use crate::domain::repositories::SetupRepository;
use crate::infrastructure::database::DatabaseService;
use crate::infrastructure::oidc::TokenManager;
use crate::infrastructure::zanzibar::{PermissionChecker, RelationshipStore};

/// Application state that holds shared services and use cases.
/// Note: Use case types are provided by the consuming crate (e.g., api-service)
/// to avoid circular dependencies.
pub struct AppState<LoginUseCase, RefreshTokenUseCase, LogoutUseCase, UserInfoUseCase, SetupOrganizationUseCase, CreateSuperAdminUseCase> {
    pub database_service: Arc<DatabaseService>,
    pub database_pool: Arc<PgPool>,
    pub login_use_case: Arc<LoginUseCase>,
    pub refresh_token_use_case: Arc<RefreshTokenUseCase>,
    pub logout_use_case: Arc<LogoutUseCase>,
    pub userinfo_use_case: Arc<UserInfoUseCase>,
    pub token_manager: Arc<TokenManager>,
    pub permission_checker: Arc<PermissionChecker>,
    pub relationship_store: Arc<RelationshipStore>,
    pub setup_repository: Arc<dyn SetupRepository>,
    pub setup_organization_use_case: Arc<SetupOrganizationUseCase>,
    pub create_super_admin_use_case: Arc<CreateSuperAdminUseCase>,
}

