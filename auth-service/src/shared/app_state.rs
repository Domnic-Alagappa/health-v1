use std::sync::Arc;
use crate::application::use_cases::auth::{
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    UserInfoUseCase,
};
use crate::application::use_cases::setup::{
    SetupOrganizationUseCase,
    CreateSuperAdminUseCase,
};
use crate::domain::repositories::SetupRepository;
use crate::infrastructure::oidc::TokenManager;
use crate::infrastructure::zanzibar::{PermissionChecker, RelationshipStore};

pub struct AppState {
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

