use axum::{Json, extract::{State, Path}, http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};
use shared::domain::repositories::GroupRepository;
use std::sync::Arc;
use uuid::Uuid;

// Type aliases for convenience
type ConcreteAppState = shared::AppState<
    authz_core::auth::LoginUseCase,
    authz_core::auth::RefreshTokenUseCase,
    authz_core::auth::LogoutUseCase,
    authz_core::auth::UserInfoUseCase,
    crate::use_cases::setup::SetupOrganizationUseCase,
    crate::use_cases::setup::CreateSuperAdminUseCase,
>;

#[derive(Debug, Deserialize)]
pub struct CreateGroupRequest {
    pub name: String,
    pub description: Option<String>,
    pub organization_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct GroupResponse {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub organization_id: Option<Uuid>,
}

impl From<shared::domain::entities::Group> for GroupResponse {
    fn from(group: shared::domain::entities::Group) -> Self {
        Self {
            id: group.id,
            name: group.name,
            description: group.description,
            organization_id: group.organization_id,
        }
    }
}

/// Create a new group
pub async fn create_group(
    State(state): State<Arc<ConcreteAppState>>,
    Json(request): Json<CreateGroupRequest>,
) -> impl IntoResponse {
    use crate::use_cases::group::CreateGroupUseCase;
    use shared::infrastructure::repositories::GroupRepositoryImpl;
    
    let group_repository = Box::new(GroupRepositoryImpl::new(state.database_pool.as_ref().clone()));
    let use_case = CreateGroupUseCase::new(
        group_repository,
        state.relationship_store.clone(),
    );
    
    let location = concat!(file!(), ":", line!());
    match use_case.execute(&request.name, request.description, request.organization_id).await {
        Ok(group) => (
            StatusCode::CREATED,
            Json(GroupResponse::from(group)),
        )
            .into_response(),
        Err(e) => {
            e.log_with_operation(location, "create_group");
            (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to create group: {}", e)
            })),
        )
                .into_response()
        }
    }
}

/// Get group by ID
pub async fn get_group(
    State(state): State<Arc<ConcreteAppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    use shared::infrastructure::repositories::GroupRepositoryImpl;
    
    let group_repository = GroupRepositoryImpl::new(state.database_pool.as_ref().clone());
    
    let location = concat!(file!(), ":", line!());
    match group_repository.find_by_id(id).await {
        Ok(Some(group)) => (
            StatusCode::OK,
            Json(GroupResponse::from(group)),
        )
            .into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({
                "error": "Group not found"
            })),
        )
            .into_response(),
        Err(e) => {
            e.log_with_operation(location, "get_group");
            (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to get group: {}", e)
            })),
        )
                .into_response()
        }
    }
}

/// List all groups
pub async fn list_groups(
    State(state): State<Arc<ConcreteAppState>>,
) -> impl IntoResponse {
    use shared::infrastructure::repositories::GroupRepositoryImpl;
    
    let group_repository = GroupRepositoryImpl::new(state.database_pool.as_ref().clone());
    
    let location = concat!(file!(), ":", line!());
    match group_repository.find_all().await {
        Ok(groups) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "groups": groups.into_iter().map(GroupResponse::from).collect::<Vec<_>>()
            })),
        )
            .into_response(),
        Err(e) => {
            e.log_with_operation(location, "list_groups");
            (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to list groups: {}", e)
            })),
        )
                .into_response()
        }
    }
}

/// Add user to group
pub async fn add_user_to_group(
    State(state): State<Arc<ConcreteAppState>>,
    Path((group_id, user_id)): Path<(Uuid, Uuid)>,
) -> impl IntoResponse {
    use crate::use_cases::group::AddUserToGroupUseCase;
    use shared::infrastructure::repositories::UserRepositoryImpl;
    
    let user_repository = Box::new(UserRepositoryImpl::new(state.database_service.clone()));
    let use_case = AddUserToGroupUseCase::new(
        user_repository,
        state.relationship_store.clone(),
    );
    
    let location = concat!(file!(), ":", line!());
    match use_case.execute(user_id, group_id).await {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "success": true,
                "message": "User added to group"
            })),
        )
            .into_response(),
        Err(e) => {
            e.log_with_operation(location, "add_user_to_group");
            (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to add user to group: {}", e)
            })),
        )
                .into_response()
        }
    }
}

/// Remove user from group (soft delete relationship)
pub async fn remove_user_from_group(
    State(state): State<Arc<ConcreteAppState>>,
    Path((group_id, user_id)): Path<(Uuid, Uuid)>,
) -> impl IntoResponse {
    let user_str = format!("user:{}", user_id);
    let group_str = format!("group:{}", group_id);
    
    let location = concat!(file!(), ":", line!());
    match state.relationship_store.soft_delete(&user_str, "member", &group_str, None).await {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "success": true,
                "message": "User removed from group"
            })),
        )
            .into_response(),
        Err(e) => {
            e.log_with_operation(location, "remove_user_from_group");
            (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to remove user from group: {}", e)
            })),
        )
                .into_response()
        }
    }
}

/// Assign role to group
pub async fn assign_role_to_group(
    State(state): State<Arc<ConcreteAppState>>,
    Path((group_id, role_id)): Path<(Uuid, Uuid)>,
) -> impl IntoResponse {
    use crate::use_cases::group::AssignRoleToGroupUseCase;
    use shared::infrastructure::repositories::{RoleRepositoryImpl, PermissionRepositoryImpl};
    
    // Create role repository with dependencies
    let permission_repo = Arc::new(PermissionRepositoryImpl::new(state.database_pool.as_ref().clone()));
    let role_repository = Box::new(RoleRepositoryImpl::new(
        state.database_service.clone(),
        state.relationship_store.clone(),
        permission_repo,
    ));
    let use_case = AssignRoleToGroupUseCase::new(
        role_repository,
        state.relationship_store.clone(),
    );
    
    let location = concat!(file!(), ":", line!());
    match use_case.execute(group_id, role_id).await {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "success": true,
                "message": "Role assigned to group"
            })),
        )
            .into_response(),
        Err(e) => {
            e.log_with_operation(location, "assign_role_to_group");
            (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to assign role to group: {}", e)
            })),
        )
                .into_response()
        }
    }
}

/// Soft delete group
pub async fn delete_group(
    State(state): State<Arc<ConcreteAppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    use shared::infrastructure::repositories::GroupRepositoryImpl;
    
    let group_repository = GroupRepositoryImpl::new(state.database_pool.as_ref().clone());
    
    let location = concat!(file!(), ":", line!());
    match group_repository.soft_delete(id, None).await {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "success": true,
                "message": "Group deleted"
            })),
        )
            .into_response(),
        Err(e) => {
            e.log_with_operation(location, "delete_group");
            (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to delete group: {}", e)
            })),
        )
                .into_response()
        }
    }
}

