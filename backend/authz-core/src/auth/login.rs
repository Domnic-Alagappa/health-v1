use crate::dto::{LoginRequest, LoginResponse, LoginUserResponse};
use shared::domain::repositories::{UserRepository, RefreshTokenRepository, RoleRepository, PermissionRepository};
use crate::oidc::TokenManager;
use shared::AppResult;
use bcrypt::verify;
use uuid::Uuid;
use chrono::{Utc, Duration};
use sha2::{Sha256, Digest};
use std::collections::HashSet;

pub struct LoginUseCase {
    user_repository: Box<dyn UserRepository>,
    refresh_token_repository: Box<dyn RefreshTokenRepository>,
    role_repository: Box<dyn RoleRepository>,
    permission_repository: Box<dyn PermissionRepository>,
    token_manager: TokenManager,
}

impl LoginUseCase {
    pub fn new(
        user_repository: Box<dyn UserRepository>,
        refresh_token_repository: Box<dyn RefreshTokenRepository>,
        role_repository: Box<dyn RoleRepository>,
        permission_repository: Box<dyn PermissionRepository>,
        token_manager: TokenManager,
    ) -> Self {
        Self {
            user_repository,
            refresh_token_repository,
            role_repository,
            permission_repository,
            token_manager,
        }
    }
    
    async fn get_user_role_and_permissions(&self, user_id: Uuid, is_super_user: bool) -> AppResult<(String, Vec<String>)> {
        // Super users bypass permission checks - return all permissions
        if is_super_user {
            let all_permissions = self.permission_repository.list().await?;
            let permission_names: Vec<String> = all_permissions.into_iter().map(|p| p.name).collect();
            return Ok(("admin".to_string(), permission_names));
        }

        // Get user roles
        let user_roles = self.role_repository.get_user_roles(user_id).await?;
        
        if user_roles.is_empty() {
            return Ok(("".to_string(), Vec::new()));
        }

        // Get primary role (first role, or admin if exists)
        let primary_role = user_roles.iter()
            .find(|r| r.name == "admin")
            .or_else(|| user_roles.first())
            .map(|r| r.name.clone())
            .unwrap_or_else(|| "".to_string());

        // Collect all unique permission IDs from all roles
        let mut permission_ids = HashSet::new();
        for role in &user_roles {
            for permission_id in &role.permissions {
                permission_ids.insert(*permission_id);
            }
        }

        // Get permission names
        let mut permission_names = Vec::new();
        for permission_id in permission_ids {
            if let Some(permission) = self.permission_repository.find_by_id(permission_id).await? {
                permission_names.push(permission.name);
            }
        }

        Ok((primary_role, permission_names))
    }

    pub async fn execute(&self, request: LoginRequest) -> AppResult<LoginResponse> {
        let location = concat!(file!(), ":", line!());
        // Find user by email
        let user = self.user_repository
            .find_by_email(&request.email)
            .await
            .map_err(|e| {
                e.log_with_operation(location, "login");
                e
            })?
            .ok_or_else(|| {
                let err = shared::AppError::Authentication("Invalid credentials".to_string());
                err.log_with_operation(location, "login");
                err
            })?;

        // Verify password
        if !verify(&request.password, &user.password_hash)
            .map_err(|_| {
                let err = shared::AppError::Authentication("Password verification failed".to_string());
                err.log_with_operation(location, "login");
                err
            })? {
            let err = shared::AppError::Authentication("Invalid credentials".to_string());
            err.log_with_operation(location, "login");
            return Err(err);
        }

        // Check if user is active
        if !user.is_active {
            let err = shared::AppError::Authentication("User account is inactive".to_string());
            err.log_with_operation(location, "login");
            return Err(err);
        }

        // Get user roles and permissions
        let (primary_role, permissions) = self.get_user_role_and_permissions(user.id, user.is_super_user).await
            .map_err(|e| {
                e.log_with_operation(location, "login");
                e
            })?;

        // Generate tokens with role and permissions in claims
        let access_token = self.token_manager.generate_access_token_with_permissions(
            &user,
            primary_role.as_str(),
            &permissions,
        )?;
        
        let refresh_token_string = self.token_manager.generate_refresh_token(&user)?;
        
        // Hash refresh token for storage
        let mut hasher = Sha256::new();
        hasher.update(refresh_token_string.as_bytes());
        let token_hash = format!("{:x}", hasher.finalize());

        // Store refresh token in database
        let refresh_token = shared::domain::repositories::refresh_token_repository::RefreshToken {
            id: Uuid::new_v4(),
            user_id: user.id,
            token_hash,
            expires_at: Utc::now() + Duration::days(7),
            created_at: Utc::now(),
            revoked_at: None,
            is_revoked: false,
        };
        self.refresh_token_repository.create(refresh_token).await?;

        // Update last login (best-effort, don't fail login if update fails)
        // This is non-critical - if update fails due to optimistic locking, login still succeeds
        let mut updated_user = user.clone();
        updated_user.record_login();
        let _ = self.user_repository.update(updated_user).await;

        // Create user response
        let user_response = LoginUserResponse {
            id: user.id.to_string(),
            email: user.email,
            username: Some(user.username),
            role: primary_role,
            permissions,
            created_at: Some(user.created_at.to_rfc3339()),
        };

        Ok(LoginResponse {
            access_token,
            refresh_token: refresh_token_string,
            expires_in: 3600,
            user: user_response,
            session_token: None, // Will be set by handler if session exists
        })
    }
}

