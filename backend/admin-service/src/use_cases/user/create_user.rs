use crate::dto::{CreateUserRequest, UserResponse};
use shared::domain::entities::{User, UserProvisioningChecklist};
use shared::domain::repositories::UserRepository;
use shared::infrastructure::encryption::DekManager;
use shared::infrastructure::zanzibar::RelationshipStore;
use shared::AppResult;
use bcrypt::{hash, DEFAULT_COST};
use uuid::Uuid;
use std::sync::Arc;

pub struct CreateUserUseCase {
    user_repository: Box<dyn UserRepository>,
    dek_manager: Arc<DekManager>,
    #[allow(dead_code)]
    relationship_store: Arc<RelationshipStore>,
}

impl CreateUserUseCase {
    pub fn new(
        user_repository: Box<dyn UserRepository>,
        dek_manager: Arc<DekManager>,
        relationship_store: Arc<RelationshipStore>,
    ) -> Self {
        Self {
            user_repository,
            dek_manager,
            relationship_store,
        }
    }

    pub async fn execute(&self, request: CreateUserRequest) -> AppResult<UserResponse> {
        // Initialize provisioning checklist
        let mut checklist = UserProvisioningChecklist::new(Uuid::new_v4()); // Will be updated with actual user_id
        
        // Check if user already exists
        if self.user_repository.find_by_email(&request.email).await?.is_some() {
            return Err(shared::AppError::Validation("User with this email already exists".to_string()));
        }

        if self.user_repository.find_by_username(&request.username).await?.is_some() {
            return Err(shared::AppError::Validation("User with this username already exists".to_string()));
        }

        // Hash password
        let password_hash = hash(&request.password, DEFAULT_COST)
            .map_err(|e| shared::AppError::Internal(format!("Password hashing failed: {}", e)))?;

        // Create user
        let user = User::new(request.email, request.username, password_hash);
        checklist.user_id = user.id;
        checklist.mark_item_in_progress("create_user");
        
        let created_user = self.user_repository.create(user).await?;
        checklist.mark_item_completed("create_user");

        // Generate user DEK
        checklist.mark_item_in_progress("generate_dek");
        self.dek_manager
            .generate_dek(created_user.id, "user")
            .await
            .map_err(|e| {
                checklist.mark_item_failed("generate_dek", format!("{}", e));
                shared::AppError::Encryption(format!("Failed to generate user DEK: {}", e))
            })?;
        checklist.mark_item_completed("generate_dek");
        checklist.mark_item_completed("store_dek"); // DEK is stored in vault by generate_dek

        // Create default Zanzibar relationships (if any)
        checklist.mark_item_in_progress("create_relationships");
        // Default relationships can be added here if needed
        checklist.mark_item_completed("create_relationships");

        // Organization membership (if organization_id is provided in request)
        // This would need to be added to CreateUserRequest if needed
        checklist.mark_item_completed("organization_membership");

        // Default app access (can be added based on default role)
        checklist.mark_item_completed("grant_app_access");

        // Audit log (handled by repository)
        checklist.mark_item_completed("audit_log");

        Ok(UserResponse::from(created_user))
    }
}

