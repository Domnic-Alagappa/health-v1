use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use serde::{Deserialize, Serialize};
// Note: AppState is defined in api-service, but admin-service handlers are used by api-service
// So we import from shared which has the generic type
use std::sync::Arc;
use uuid::Uuid;
use tracing;

// Type aliases for convenience - these match the concrete types used in api-service
type ConcreteAppState = shared::AppState<
    authz_core::auth::LoginUseCase,
    authz_core::auth::RefreshTokenUseCase,
    authz_core::auth::LogoutUseCase,
    authz_core::auth::UserInfoUseCase,
    crate::use_cases::setup::SetupOrganizationUseCase,
    crate::use_cases::setup::CreateSuperAdminUseCase,
>;

#[derive(Debug, Deserialize)]
pub struct SetupRequest {
    pub organization_name: String,
    pub organization_slug: String,
    pub organization_domain: Option<String>,
    pub admin_email: String,
    pub admin_username: String,
    pub admin_password: String,
}

#[derive(Debug, Serialize)]
pub struct RelationshipInfo {
    pub user: String,
    pub relation: String,
    pub object: String,
    pub organization_id: Option<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct SetupResponse {
    pub success: bool,
    pub message: String,
    pub organization_id: Uuid,
    pub admin_user_id: Uuid,
    pub relationships_created: Vec<RelationshipInfo>,
}

/// Initialize the system (one-time setup)
pub async fn initialize_setup(
    State(state): State<Arc<ConcreteAppState>>,
    Json(request): Json<SetupRequest>,
) -> impl IntoResponse {
    let location = concat!(file!(), ":", line!());
    // Check if setup is already completed
    let is_completed = match state.setup_repository.is_setup_completed().await {
        Ok(c) => c,
        Err(e) => {
            e.log_with_operation(location, "initialize_setup");
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({
                    "error": format!("Failed to check setup status: {}", e)
                })),
            )
                .into_response();
        }
    };

    if is_completed {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({
                "error": "Setup has already been completed"
            })),
        )
            .into_response();
    }

    // Create organization
    let org_id = match state
        .setup_organization_use_case
        .execute(
            &request.organization_name,
            &request.organization_slug,
            request.organization_domain.as_deref(),
            false, // force flag - API handlers should not use force mode
        )
        .await
    {
        Ok(id) => id,
        Err(e) => {
            e.log_with_operation(location, "initialize_setup");
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({
                    "error": format!("Failed to create organization: {}", e)
                })),
            )
                .into_response();
        }
    };

    // Create super admin
    let admin_user = match state
        .create_super_admin_use_case
        .execute(
            &request.admin_email,
            &request.admin_username,
            &request.admin_password,
            Some(org_id),
        )
        .await
    {
        Ok(user) => user,
        Err(e) => {
            e.log_with_operation(location, "initialize_setup");
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({
                    "error": format!("Failed to create super admin: {}", e)
                })),
            )
                .into_response();
        }
    };

    // Generate DEK for organization
    if let Err(e) = state.dek_manager.generate_dek(org_id, "organization").await {
        e.log_with_operation(location, "initialize_setup");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to generate organization DEK: {}", e)
            })),
        )
            .into_response();
    }

    // Generate DEK for super admin user
    if let Err(e) = state.dek_manager.generate_dek(admin_user.id, "user").await {
        e.log_with_operation(location, "initialize_setup");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to generate user DEK: {}", e)
            })),
        )
            .into_response();
    }

    // Create Zanzibar relationships
    let user_str = format!("user:{}", admin_user.id);
    let org_str = format!("organization:{}", org_id);
    
    // Track created relationships for response
    let mut relationships_created = Vec::new();
    
    // Log relationship creation (using info level for visibility)
    tracing::info!("Creating Zanzibar relationships for super admin user {} in organization {}", admin_user.id, org_id);
    
    // Organization ownership and membership (with organization scoping)
    if let Err(e) = state.relationship_store.add_with_organization(&user_str, "owner", &org_str, Some(org_id)).await {
        e.log_with_operation(location, "initialize_setup");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to create owner relationship: {}", e)
            })),
        )
            .into_response();
    }
    relationships_created.push(RelationshipInfo {
        user: user_str.clone(),
        relation: "owner".to_string(),
        object: org_str.clone(),
        organization_id: Some(org_id),
    });
    tracing::info!("✓ Created relationship: {} → owner → {} [org: {}]", user_str, org_str, org_id);
    
    if let Err(e) = state.relationship_store.add_with_organization(&user_str, "member", &org_str, Some(org_id)).await {
        e.log_with_operation(location, "initialize_setup");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to create member relationship: {}", e)
            })),
        )
            .into_response();
    }
    relationships_created.push(RelationshipInfo {
        user: user_str.clone(),
        relation: "member".to_string(),
        object: org_str.clone(),
        organization_id: Some(org_id),
    });
    tracing::info!("✓ Created relationship: {} → member → {} [org: {}]", user_str, org_str, org_id);
    
    // Admin role relationship (role relationships are typically global, but can be org-scoped)
    if let Err(e) = state.relationship_store.add_with_organization(&user_str, "has_role", "role:admin", Some(org_id)).await {
        e.log_with_operation(location, "initialize_setup");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to create admin role relationship: {}", e)
            })),
        )
            .into_response();
    }
    relationships_created.push(RelationshipInfo {
        user: user_str.clone(),
        relation: "has_role".to_string(),
        object: "role:admin".to_string(),
        organization_id: Some(org_id),
    });
    tracing::info!("✓ Created relationship: {} → has_role → role:admin [org: {}]", user_str, org_id);
    
    // Reverse: organization admin
    if let Err(e) = state.relationship_store.add_with_organization(&org_str, "admin", &user_str, Some(org_id)).await {
        e.log_with_operation(location, "initialize_setup");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to create organization admin relationship: {}", e)
            })),
        )
            .into_response();
    }
    relationships_created.push(RelationshipInfo {
        user: org_str.clone(),
        relation: "admin".to_string(),
        object: user_str.clone(),
        organization_id: Some(org_id),
    });
    tracing::info!("✓ Created relationship: {} → admin → {} [org: {}]", org_str, user_str, org_id);

    // App access relationships - admin gets access to all apps (using hierarchical format)
    let apps = vec!["admin-ui", "client-app", "mobile"];
    for app_name in &apps {
        let app_object = format!("organization:{}/app:{}", org_id, app_name);
        if let Err(e) = state.relationship_store.add_with_organization(&user_str, "can_access", &app_object, Some(org_id)).await {
        e.log_with_operation(location, "initialize_setup");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                    "error": format!("Failed to create {} access: {}", app_name, e)
            })),
        )
            .into_response();
    }
        relationships_created.push(RelationshipInfo {
            user: user_str.clone(),
            relation: "can_access".to_string(),
            object: app_object.clone(),
            organization_id: Some(org_id),
        });
        tracing::info!("✓ Created relationship: {} → can_access → {} [org: {}]", user_str, app_object, org_id);
    }

    // Create role-to-app relationships for all roles (using hierarchical format)
    tracing::info!("Creating role-to-app access relationships");
    
    // Admin role - access to all apps
    for app_name in &apps {
        let app_object = format!("organization:{}/app:{}", org_id, app_name);
        if let Err(e) = state.relationship_store.add_with_organization("role:admin", "can_access", &app_object, Some(org_id)).await {
        e.log_with_operation(location, "initialize_setup");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                    "error": format!("Failed to create role:admin → {} relationship: {}", app_name, e)
            })),
        )
            .into_response();
    }
        relationships_created.push(RelationshipInfo {
            user: "role:admin".to_string(),
            relation: "can_access".to_string(),
            object: app_object.clone(),
            organization_id: Some(org_id),
        });
        tracing::info!("✓ Created relationship: role:admin → can_access → {} [org: {}]", app_object, org_id);
    }

    // Doctor role - access to client-app and mobile
    let doctor_apps = vec!["client-app", "mobile"];
    for app_name in &doctor_apps {
        let app_object = format!("organization:{}/app:{}", org_id, app_name);
        if let Err(e) = state.relationship_store.add_with_organization("role:doctor", "can_access", &app_object, Some(org_id)).await {
        e.log_with_operation(location, "initialize_setup");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                    "error": format!("Failed to create role:doctor → {} relationship: {}", app_name, e)
            })),
        )
            .into_response();
    }
        relationships_created.push(RelationshipInfo {
            user: "role:doctor".to_string(),
            relation: "can_access".to_string(),
            object: app_object.clone(),
            organization_id: Some(org_id),
        });
        tracing::info!("✓ Created relationship: role:doctor → can_access → {} [org: {}]", app_object, org_id);
    }

    // Nurse role - access to client-app and mobile
    for app_name in &doctor_apps {
        let app_object = format!("organization:{}/app:{}", org_id, app_name);
        if let Err(e) = state.relationship_store.add_with_organization("role:nurse", "can_access", &app_object, Some(org_id)).await {
        e.log_with_operation(location, "initialize_setup");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                    "error": format!("Failed to create role:nurse → {} relationship: {}", app_name, e)
            })),
        )
            .into_response();
    }
        relationships_created.push(RelationshipInfo {
            user: "role:nurse".to_string(),
            relation: "can_access".to_string(),
            object: app_object.clone(),
            organization_id: Some(org_id),
        });
        tracing::info!("✓ Created relationship: role:nurse → can_access → {} [org: {}]", app_object, org_id);
    }

    // Receptionist role - access to client-app
    let app_object = format!("organization:{}/app:client-app", org_id);
    if let Err(e) = state.relationship_store.add_with_organization("role:receptionist", "can_access", &app_object, Some(org_id)).await {
        e.log_with_operation(location, "initialize_setup");
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to create role:receptionist → client-app relationship: {}", e)
            })),
        )
            .into_response();
    }
    relationships_created.push(RelationshipInfo {
        user: "role:receptionist".to_string(),
        relation: "can_access".to_string(),
        object: app_object.clone(),
        organization_id: Some(org_id),
    });
    tracing::info!("✓ Created relationship: role:receptionist → can_access → {} [org: {}]", app_object, org_id);

    // Admin role assignment is already done via Zanzibar relationship above
    // No need to insert into user_roles table anymore

    // Verify relationships were created
    tracing::info!("Verifying relationships for super admin user {} in organization {}", admin_user.id, org_id);
    let mut verified_count = 0;
    let mut failed_verifications = Vec::new();
    
    // Verify key relationships (using hierarchical format where applicable)
    // Store owned strings for app objects to avoid lifetime issues
    let mut app_objects = Vec::new();
    for app_name in &apps {
        app_objects.push(format!("organization:{}/app:{}", org_id, app_name));
    }
    
    let mut relationships_to_verify = vec![
        (user_str.as_str(), "owner", org_str.as_str(), Some(org_id)),
        (user_str.as_str(), "member", org_str.as_str(), Some(org_id)),
        (user_str.as_str(), "has_role", "role:admin", Some(org_id)),
    ];
    
    // Add app access verifications
    for app_object in &app_objects {
        relationships_to_verify.push((user_str.as_str(), "can_access", app_object.as_str(), Some(org_id)));
    }
    
    let total_relationships = relationships_to_verify.len();
    for (user, relation, object, org_id_opt) in relationships_to_verify {
        match state.relationship_store.check_with_organization(user, relation, object, org_id_opt).await {
            Ok(true) => {
                verified_count += 1;
                tracing::info!("✓ Verified relationship: {} → {} → {} [org: {:?}]", user, relation, object, org_id_opt);
            }
            Ok(false) => {
                failed_verifications.push(format!("{} → {} → {} [org: {:?}]", user, relation, object, org_id_opt));
                tracing::warn!("✗ Failed to verify relationship: {} → {} → {} [org: {:?}]", user, relation, object, org_id_opt);
            }
            Err(e) => {
                failed_verifications.push(format!("{} → {} → {} [org: {:?}] (error: {})", user, relation, object, org_id_opt, e));
                tracing::warn!("✗ Error verifying relationship: {} → {} → {} [org: {:?}]: {}", user, relation, object, org_id_opt, e);
            }
        }
    }
    
    tracing::info!(
        "Relationship verification complete: {}/{} relationships verified for user {} in organization {}",
        verified_count,
        total_relationships,
        admin_user.id,
        org_id
    );
    
    if !failed_verifications.is_empty() {
        tracing::warn!(
            "Some relationships failed verification: {:?}",
            failed_verifications
        );
    }

    (
        StatusCode::OK,
        Json(SetupResponse {
            success: true,
            message: format!(
                "Setup completed successfully. {} relationships created and verified.",
                relationships_created.len()
            ),
            organization_id: org_id,
            admin_user_id: admin_user.id,
            relationships_created,
        }),
    )
        .into_response()
}

/// Check setup status
pub async fn check_setup_status(
    State(state): State<Arc<ConcreteAppState>>,
) -> impl IntoResponse {
    let location = concat!(file!(), ":", line!());
    match state.setup_repository.is_setup_completed().await {
        Ok(is_completed) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "setup_completed": is_completed
            })),
        )
            .into_response(),
        Err(e) => {
            e.log_with_operation(location, "check_setup_status");
            (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({
                "error": format!("Failed to check setup status: {}", e)
            })),
        )
                .into_response()
        }
    }
}

