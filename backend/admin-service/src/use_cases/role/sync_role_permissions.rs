use shared::domain::repositories::{RoleRepository, PermissionRepository};
use shared::infrastructure::zanzibar::RelationshipStore;
use shared::AppResult;
use uuid::Uuid;
use std::sync::Arc;

/// Sync role permissions to Zanzibar relationships
/// When role permissions change, this creates/removes Zanzibar relationships
/// Note: Permissions are now stored in Zanzibar only, not in database tables
pub struct SyncRolePermissionsUseCase {
    role_repository: Box<dyn RoleRepository>,
    permission_repository: Box<dyn PermissionRepository>,
    relationship_store: Arc<RelationshipStore>,
}

impl SyncRolePermissionsUseCase {
    pub fn new(
        role_repository: Box<dyn RoleRepository>,
        permission_repository: Box<dyn PermissionRepository>,
        relationship_store: Arc<RelationshipStore>,
    ) -> Self {
        Self {
            role_repository,
            permission_repository,
            relationship_store,
        }
    }

    /// Sync all permissions for a role to Zanzibar
    pub async fn execute(&self, role_id: Uuid) -> AppResult<()> {
        // Get role
        let role = self.role_repository
            .find_by_id(role_id)
            .await?
            .ok_or_else(|| shared::AppError::NotFound(
                format!("Role {} not found", role_id)
            ))?;

        let role_str = format!("role:{}", role.name);

        // Get all permissions for this role (from role.permissions field)
        // Note: role.permissions is populated from Zanzibar, so this syncs them back
        for permission_id in &role.permissions {
            if let Some(permission) = self.permission_repository.find_by_id(*permission_id).await? {
                // Format: role:admin#view@resource:patient
                let resource_str = format!("resource:{}", permission.resource);
                let action = &permission.action;
                
                // Create relationship: role#action@resource
                self.relationship_store
                    .add(&role_str, action, &resource_str)
                    .await?;
            }
        }

        Ok(())
    }

    /// Remove all Zanzibar relationships for a role
    pub async fn remove_role_permissions(&self, role_id: Uuid) -> AppResult<()> {
        // Get role
        let role = self.role_repository
            .find_by_id(role_id)
            .await?
            .ok_or_else(|| shared::AppError::NotFound(
                format!("Role {} not found", role_id)
            ))?;

        let role_str = format!("role:{}", role.name);

        // Get all relationships for this role
        let relationships = self.relationship_store
            .get_relationships(&role_str)
            .await?;

        // Soft delete all relationships
        for rel in relationships {
            self.relationship_store
                .soft_delete(&rel.user, &rel.relation, &rel.object, None)
                .await?;
        }

        Ok(())
    }
}

