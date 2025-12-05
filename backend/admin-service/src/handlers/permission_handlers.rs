use axum::{Json, extract::{State, Path}, http::StatusCode, response::IntoResponse};
use serde::Deserialize;
use std::sync::Arc;
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json::Value;

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
pub struct CreatePermissionRequest {
    pub user_id: Uuid,
    pub relation: String,
    pub object: String,
    pub expires_at: Option<DateTime<Utc>>,
    pub valid_from: Option<DateTime<Utc>>,
    pub metadata: Option<Value>,
    pub encrypt_metadata: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct ExtendPermissionRequest {
    pub new_expires_at: DateTime<Utc>,
}

/// Create individual permission
pub async fn create_permission(
    State(state): State<Arc<ConcreteAppState>>,
    Json(request): Json<CreatePermissionRequest>,
) -> impl IntoResponse {
    use crate::use_cases::permission::CreatePermissionUseCase;
    use shared::infrastructure::repositories::RelationshipRepositoryImpl;
    
    let relationship_repository = Box::new(RelationshipRepositoryImpl::new(state.database_pool.as_ref().clone()));
    let use_case = CreatePermissionUseCase::new(
        relationship_repository,
        state.relationship_store.clone(),
        state.dek_manager.clone(),
    );
    
    match use_case.execute(
        request.user_id,
        &request.relation,
        &request.object,
        request.expires_at,
        request.valid_from,
        request.metadata,
        request.encrypt_metadata.unwrap_or(false),
    ).await {
        Ok(relationship) => (
            StatusCode::CREATED,
            Json(serde_json::json!({
                "id": relationship.id,
                "user": relationship.user,
                "relation": relationship.relation,
                "object": relationship.object,
                "expires_at": relationship.expires_at,
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to create permission: {}", e)
            })),
        )
            .into_response(),
    }
}

/// Extend permission expiration
pub async fn extend_permission(
    State(state): State<Arc<ConcreteAppState>>,
    Path(id): Path<Uuid>,
    Json(request): Json<ExtendPermissionRequest>,
) -> impl IntoResponse {
    use crate::use_cases::permission::ExtendPermissionUseCase;
    use shared::domain::repositories::RelationshipRepository;
    use shared::infrastructure::repositories::RelationshipRepositoryImpl;
    
    // Get relationship to find user_id, relation, object
    let relationship_repository = RelationshipRepositoryImpl::new(state.database_pool.as_ref().clone());
    let relationship = match relationship_repository.find_by_id(id).await {
        Ok(Some(rel)) => rel,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({
                    "error": "Permission not found"
                })),
            )
                .into_response();
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": format!("Failed to find permission: {}", e)
                })),
            )
                .into_response();
        }
    };
    
    // Extract user_id from user string (e.g., "user:123" -> 123)
    let user_id_str = relationship.user.strip_prefix("user:").unwrap_or(&relationship.user);
    let user_id = match Uuid::parse_str(user_id_str) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({
                    "error": "Invalid user ID in relationship"
                })),
            )
                .into_response();
        }
    };
    
    let use_case = ExtendPermissionUseCase::new(state.relationship_store.clone());
    
    match use_case.execute(user_id, &relationship.relation, &relationship.object, request.new_expires_at).await {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "success": true,
                "message": "Permission expiration extended"
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to extend permission: {}", e)
            })),
        )
            .into_response(),
    }
}

/// Revoke permission by relationship ID (soft delete)
pub async fn revoke_permission_by_id(
    State(state): State<Arc<ConcreteAppState>>,
    Path(id): Path<Uuid>,
) -> impl IntoResponse {
    use crate::use_cases::permission::RevokePermissionUseCase;
    use shared::domain::repositories::RelationshipRepository;
    use shared::infrastructure::repositories::RelationshipRepositoryImpl;
    
    // Get relationship to find user_id, relation, object
    let relationship_repository = RelationshipRepositoryImpl::new(state.database_pool.as_ref().clone());
    let relationship = match relationship_repository.find_by_id(id).await {
        Ok(Some(rel)) => rel,
        Ok(None) => {
            return (
                StatusCode::NOT_FOUND,
                Json(serde_json::json!({
                    "error": "Permission not found"
                })),
            )
                .into_response();
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": format!("Failed to find permission: {}", e)
                })),
            )
                .into_response();
        }
    };
    
    // Extract user_id from user string
    let user_id_str = relationship.user.strip_prefix("user:").unwrap_or(&relationship.user);
    let user_id = match Uuid::parse_str(user_id_str) {
        Ok(id) => id,
        Err(_) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({
                    "error": "Invalid user ID in relationship"
                })),
            )
                .into_response();
        }
    };
    
    let use_case = RevokePermissionUseCase::new(state.relationship_store.clone());
    
    match use_case.execute(user_id, &relationship.relation, &relationship.object, None).await {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "success": true,
                "message": "Permission revoked"
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to revoke permission: {}", e)
            })),
        )
            .into_response(),
    }
}

/// List user permissions (union of all sources)
pub async fn list_user_permissions(
    State(state): State<Arc<ConcreteAppState>>,
    Path(user_id): Path<Uuid>,
) -> impl IntoResponse {
    let user_str = format!("user:{}", user_id);
    
    match state.permission_checker.get_all_permissions(&user_str).await {
        Ok(permissions) => {
            let permissions_vec: Vec<_> = permissions.into_iter()
                .map(|(relation, object)| serde_json::json!({
                    "relation": relation,
                    "object": object
                }))
                .collect();
            
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "user_id": user_id,
                    "permissions": permissions_vec
                })),
            )
                .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to get user permissions: {}", e)
            })),
        )
            .into_response(),
    }
}


#[derive(Debug, Deserialize)]
pub struct AssignPermissionRequest {
    pub subject: String,
    pub relation: String,
    pub object: String,
    pub expires_at: Option<DateTime<Utc>>,
    pub valid_from: Option<DateTime<Utc>>,
    pub metadata: Option<Value>,
}

#[derive(Debug, Deserialize)]
pub struct BatchAssignPermissionRequest {
    pub assignments: Vec<AssignPermissionRequest>,
}

#[derive(Debug, Deserialize)]
pub struct RevokePermissionRequest {
    pub subject: String,
    pub relation: String,
    pub object: String,
}

pub async fn assign_permission(
    State(state): State<Arc<ConcreteAppState>>,
    Json(request): Json<AssignPermissionRequest>,
) -> impl IntoResponse {
    match state.relationship_store.add_with_metadata(
        &request.subject,
        &request.relation,
        &request.object,
        request.metadata,
        request.expires_at,
    ).await {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "success": true,
                "message": "Permission assigned"
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to assign permission: {}", e)
            })),
        )
            .into_response(),
    }
}

pub async fn assign_permissions_batch(
    State(state): State<Arc<ConcreteAppState>>,
    Json(request): Json<BatchAssignPermissionRequest>,
) -> impl IntoResponse {
    let mut results = Vec::new();
    let mut errors = Vec::new();
    
    for assignment in request.assignments {
        match state.relationship_store.add_with_metadata(
            &assignment.subject,
            &assignment.relation,
            &assignment.object,
            assignment.metadata,
            assignment.expires_at,
        ).await {
            Ok(_) => results.push(true),
            Err(e) => {
                errors.push(format!("Failed to assign {}#{}@{}: {}", 
                    assignment.subject, assignment.relation, assignment.object, e));
                results.push(false);
            }
        }
    }
    
    if errors.is_empty() {
        (
            StatusCode::OK,
            Json(serde_json::json!({
                "success": true,
                "message": "All permissions assigned",
                "count": results.len()
            })),
        )
            .into_response()
    } else {
        (
            StatusCode::PARTIAL_CONTENT,
            Json(serde_json::json!({
                "success": false,
                "message": "Some permissions failed to assign",
                "errors": errors,
                "count": results.len()
            })),
        )
            .into_response()
    }
}

pub async fn revoke_permission(
    State(state): State<Arc<ConcreteAppState>>,
    Json(request): Json<RevokePermissionRequest>,
) -> impl IntoResponse {
    match state.relationship_store.revoke(
        &request.subject,
        &request.relation,
        &request.object,
        None,
    ).await {
        Ok(_) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "success": true,
                "message": "Permission revoked"
            })),
        )
            .into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": format!("Failed to revoke permission: {}", e)
            })),
        )
            .into_response(),
    }
}
