use shared::domain::repositories::{UserRepository, RoleRepository, PermissionRepository};
use shared::AppResult;
use uuid::Uuid;

pub struct GetUserPermissionsUseCase {
    user_repository: Box<dyn UserRepository>,
    role_repository: Box<dyn RoleRepository>,
    permission_repository: Box<dyn PermissionRepository>,
}

impl GetUserPermissionsUseCase {
    pub fn new(
        user_repository: Box<dyn UserRepository>,
        role_repository: Box<dyn RoleRepository>,
        permission_repository: Box<dyn PermissionRepository>,
    ) -> Self {
        Self {
            user_repository,
            role_repository,
            permission_repository,
        }
    }

    pub async fn execute(&self, user_id: Uuid) -> AppResult<(String, Vec<String>)> {
        let user = self.user_repository
            .find_by_id(user_id)
            .await?
            .ok_or_else(|| shared::AppError::NotFound("User not found".to_string()))?;

        // Super users bypass permission checks - return all permissions
        if user.is_super_user {
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
        let mut permission_ids = std::collections::HashSet::new();
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
}

