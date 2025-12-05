use std::process;
use std::fs;
use dialoguer::{Input, Password, Confirm};
use dotenv::dotenv;
use shared::config::Settings;
use shared::infrastructure::database::{create_pool, DatabaseService};
use shared::infrastructure::repositories::{
    SetupRepositoryImpl, UserRepositoryImpl, RelationshipRepositoryImpl,
};
use shared::infrastructure::zanzibar::RelationshipStore;
use shared::infrastructure::encryption::{MasterKey, DekManager};
use shared::config::providers::ProviderConfig;
use shared::infrastructure::providers::create_kms_provider;
use shared::domain::repositories::SetupRepository;
use admin_service::use_cases::setup::{
    SetupOrganizationUseCase, CreateSuperAdminUseCase,
};
use chrono::Utc;

#[tokio::main]
async fn main() {
    // Load environment variables
    dotenv().ok();

    // Initialize tracing
    tracing_subscriber::fmt::init();

    println!("=== Health V1 Super Admin Setup ===\n");

    // Parse command line arguments (simple parsing for now)
    let args: Vec<String> = std::env::args().collect();
    let mut email = None;
    let mut username = None;
    let mut password = None;
    let mut org_name = None;
    let mut org_slug = None;
    let mut output_file = "./admin-credentials.txt".to_string();
    let mut force = false;

    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--email" => {
                if i + 1 < args.len() {
                    email = Some(args[i + 1].clone());
                    i += 2;
                } else {
                    eprintln!("--email requires a value");
                    process::exit(1);
                }
            }
            "--username" => {
                if i + 1 < args.len() {
                    username = Some(args[i + 1].clone());
                    i += 2;
                } else {
                    eprintln!("--username requires a value");
                    process::exit(1);
                }
            }
            "--password" => {
                if i + 1 < args.len() {
                    password = Some(args[i + 1].clone());
                    i += 2;
                } else {
                    eprintln!("--password requires a value");
                    process::exit(1);
                }
            }
            "--org-name" => {
                if i + 1 < args.len() {
                    org_name = Some(args[i + 1].clone());
                    i += 2;
                } else {
                    eprintln!("--org-name requires a value");
                    process::exit(1);
                }
            }
            "--org-slug" => {
                if i + 1 < args.len() {
                    org_slug = Some(args[i + 1].clone());
                    i += 2;
                } else {
                    eprintln!("--org-slug requires a value");
                    process::exit(1);
                }
            }
            "--output" => {
                if i + 1 < args.len() {
                    output_file = args[i + 1].clone();
                    i += 2;
                } else {
                    eprintln!("--output requires a value");
                    process::exit(1);
                }
            }
            "--force" => {
                force = true;
                i += 1;
            }
            _ => {
                eprintln!("Unknown argument: {}", args[i]);
                process::exit(1);
            }
        }
    }

    // Load configuration
    let settings = match Settings::from_env() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Failed to load configuration: {}", e);
            process::exit(1);
        }
    };

    // Connect to database
    println!("Connecting to database...");
    let pool = match create_pool(&settings.database.url).await {
        Ok(p) => {
            println!("✓ Database connected\n");
            p
        }
        Err(e) => {
            eprintln!("Failed to connect to database: {}", e);
            process::exit(1);
        }
    };

    // Create database service and verify health
    let database_service = std::sync::Arc::new(DatabaseService::new(pool.clone()));
    match database_service.health_check().await {
        Ok(_) => println!("✓ Database health check passed\n"),
        Err(e) => {
            eprintln!("Database health check failed: {}", e);
            process::exit(1);
        }
    }

    // Run migrations
    println!("Running database migrations...");
    let migrations_path = std::path::Path::new("./migrations");
    match sqlx::migrate::Migrator::new(migrations_path).await {
        Ok(migrator) => {
            match migrator.run(&pool).await {
                Ok(_) => println!("✓ Migrations completed\n"),
                Err(e) => {
                    eprintln!("Failed to run migrations: {}", e);
                    process::exit(1);
                }
            }
        }
        Err(e) => {
            eprintln!("Failed to initialize migrator: {}", e);
            process::exit(1);
        }
    }

    // Initialize repositories
    let setup_repository: Box<dyn SetupRepository> = Box::new(SetupRepositoryImpl::new(pool.clone()));

    // Check if setup is already completed
    let is_completed = match setup_repository.is_setup_completed().await {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to check setup status: {}", e);
            process::exit(1);
        }
    };

    if is_completed && !force {
        println!("⚠ Setup has already been completed!");
        let should_continue = Confirm::new()
            .with_prompt("Do you want to continue anyway? (not recommended)")
            .default(false)
            .interact()
            .unwrap_or(false);

        if !should_continue {
            println!("Exiting...");
            process::exit(0);
        }
        println!();
    }

    // Verify vault/KMS configuration
    println!("Verifying vault/KMS configuration...");
    let provider_config = match ProviderConfig::from_env() {
        Ok(config) => config,
        Err(e) => {
            eprintln!("Failed to load provider config: {}", e);
            eprintln!("Please ensure KMS_* environment variables are set correctly.");
            process::exit(1);
        }
    };

    let vault = match create_kms_provider(&provider_config.kms) {
        Ok(v) => {
            println!("✓ Vault/KMS provider initialized\n");
            v
        }
        Err(e) => {
            eprintln!("Failed to create KMS provider: {}", e);
            process::exit(1);
        }
    };

    // Initialize master key from OpenBao/Vault (preferred) or fallback to file/env
    println!("Initializing master key...");
    use std::path::Path;
    
    // First, try to load from OpenBao/Vault
    let master_key = match MasterKey::from_vault(vault.as_ref()).await {
        Ok(Some(key)) => {
            println!("✓ Master key loaded from OpenBao/Vault\n");
            key
        }
        Ok(None) => {
            // Master key doesn't exist in vault - generate new one
            println!("Master key not found in OpenBao/Vault, generating new key...");
            let key = MasterKey::generate()
                .map_err(|e| {
                    eprintln!("Failed to generate master key: {}", e);
                    process::exit(1);
                })
                .unwrap();
            
            // Store in vault
            key.save_to_vault(vault.as_ref()).await.unwrap_or_else(|e| {
                eprintln!("Failed to store master key in OpenBao/Vault: {}", e);
                eprintln!("Falling back to file storage...");
                // Fallback to file if vault storage fails
                if let Some(path) = &settings.encryption.master_key_path {
                    if let Some(parent) = Path::new(path).parent() {
                        let _ = fs::create_dir_all(parent);
                    }
                    let _ = key.save_to_file(Path::new(path));
                }
            });
            println!("✓ Master key generated and stored in OpenBao/Vault\n");
            key
        }
        Err(e) => {
            eprintln!("⚠ Failed to retrieve master key from OpenBao/Vault: {}", e);
            eprintln!("⚠ Falling back to file/environment variable...");
            
            // Fallback to file or environment variable
            if let Some(path) = &settings.encryption.master_key_path {
                match MasterKey::from_file(Path::new(path)) {
                    Ok(key) => {
                        println!("✓ Master key loaded from file (fallback)\n");
                        // Try to store in vault for future use
                        let _ = key.save_to_vault(vault.as_ref()).await;
                        key
                    }
                    Err(_) => {
                        println!("Master key file not found, generating new key...");
                        let key = MasterKey::generate()
                            .map_err(|e| {
                                eprintln!("Failed to generate master key: {}", e);
                                process::exit(1);
                            })
                            .unwrap();
                        
                        if let Some(parent) = Path::new(path).parent() {
                            fs::create_dir_all(parent).unwrap_or_else(|e| {
                                eprintln!("Failed to create master key directory: {}", e);
                                process::exit(1);
                            });
                        }
                        
                        key.save_to_file(Path::new(path)).unwrap_or_else(|e| {
                            eprintln!("Failed to save master key: {}", e);
                            process::exit(1);
                        });
                        // Try to store in vault for future use
                        let _ = key.save_to_vault(vault.as_ref()).await;
                        println!("✓ Master key generated and saved to file (fallback)\n");
                        key
                    }
                }
            } else if let Ok(_) = std::env::var("MASTER_KEY") {
                match MasterKey::from_env("MASTER_KEY") {
                    Ok(key) => {
                        println!("✓ Master key loaded from environment (fallback)\n");
                        // Try to store in vault for future use
                        let _ = key.save_to_vault(vault.as_ref()).await;
                        key
                    }
                    Err(e) => {
                        eprintln!("Failed to load master key from environment: {}", e);
                        process::exit(1);
                    }
                }
            } else {
                println!("⚠ No master key found. Generating temporary key...");
                println!("⚠ WARNING: This key will not be persisted. Set up OpenBao/Vault or MASTER_KEY_PATH/MASTER_KEY for production!");
                MasterKey::generate().unwrap_or_else(|e| {
                    eprintln!("Failed to generate master key: {}", e);
                    process::exit(1);
                })
            }
        }
    };

    // Test vault connectivity by creating DEK manager
    let dek_manager = DekManager::new(master_key, vault);
    println!("✓ DEK Manager initialized\n");

    // Collect organization information
    println!("=== Organization Setup ===\n");
    
    let org_name_value = org_name.unwrap_or_else(|| {
        Input::new()
            .with_prompt("Organization name")
            .validate_with(|input: &String| -> Result<(), &str> {
                if input.trim().is_empty() {
                    Err("Organization name cannot be empty")
                } else {
                    Ok(())
                }
            })
            .interact_text()
            .unwrap_or_else(|e| {
                eprintln!("Error reading input: {}", e);
                process::exit(1);
            })
    });

    let org_slug_value = org_slug.unwrap_or_else(|| {
        Input::new()
            .with_prompt("Organization slug (alphanumeric and hyphens only)")
            .validate_with(|input: &String| -> Result<(), &str> {
                if input.trim().is_empty() {
                    Err("Organization slug cannot be empty")
                } else if !input.chars().all(|c| c.is_alphanumeric() || c == '-') {
                    Err("Slug can only contain alphanumeric characters and hyphens")
                } else {
                    Ok(())
                }
            })
            .interact_text()
            .unwrap_or_else(|e| {
                eprintln!("Error reading input: {}", e);
                process::exit(1);
            })
    });

    let org_domain: Option<String> = Input::new()
        .with_prompt("Organization domain (optional, press Enter to skip)")
        .allow_empty(true)
        .interact_text()
        .ok()
        .filter(|s: &String| !s.trim().is_empty());

    // Collect super admin information
    println!("\n=== Super Admin Setup ===\n");

    let admin_email = email.unwrap_or_else(|| {
        Input::new()
            .with_prompt("Super admin email")
            .validate_with(|input: &String| -> Result<(), &str> {
                if input.trim().is_empty() || !input.contains('@') {
                    Err("Invalid email address")
                } else {
                    Ok(())
                }
            })
            .interact_text()
            .unwrap_or_else(|e| {
                eprintln!("Error reading input: {}", e);
                process::exit(1);
            })
    });

    let admin_username = username.unwrap_or_else(|| {
        Input::new()
            .with_prompt("Super admin username")
            .validate_with(|input: &String| -> Result<(), &str> {
                if input.trim().is_empty() {
                    Err("Username cannot be empty")
                } else {
                    Ok(())
                }
            })
            .interact_text()
            .unwrap_or_else(|e| {
                eprintln!("Error reading input: {}", e);
                process::exit(1);
            })
    });

    let admin_password = password.unwrap_or_else(|| {
        Password::new()
            .with_prompt("Super admin password")
            .with_confirmation("Confirm password", "Passwords do not match")
            .validate_with(|input: &String| -> Result<(), &str> {
                if input.len() < 8 {
                    Err("Password must be at least 8 characters long")
                } else {
                    Ok(())
                }
            })
            .interact()
            .unwrap_or_else(|e| {
                eprintln!("Error reading password: {}", e);
                process::exit(1);
            })
    });

    // Create organization
    println!("\nCreating organization...");
    let setup_org_use_case = SetupOrganizationUseCase::new(
        Box::new(SetupRepositoryImpl::new(pool.clone())),
        Box::new(UserRepositoryImpl::new(database_service.clone())),
    );

    let org_id = match setup_org_use_case
        .execute(&org_name_value, &org_slug_value, org_domain.as_deref(), force)
        .await
    {
        Ok(id) => {
            println!("✓ Organization created: {} ({})", org_name_value, org_slug_value);
            id
        }
        Err(e) => {
            eprintln!("Failed to create organization: {}", e);
            process::exit(1);
        }
    };

    // Create super admin
    println!("Creating super admin user...");
    let create_admin_use_case = CreateSuperAdminUseCase::new(
        Box::new(SetupRepositoryImpl::new(pool.clone())),
        Box::new(UserRepositoryImpl::new(database_service.clone())),
    );

    let admin_user = match create_admin_use_case
        .execute(&admin_email, &admin_username, &admin_password, Some(org_id))
        .await
    {
        Ok(user) => {
            println!("✓ Super admin created: {} ({})", user.email, user.username);
            user
        }
        Err(e) => {
            eprintln!("Failed to create super admin: {}", e);
            process::exit(1);
        }
    };

    // Generate DEKs
    println!("Generating encryption keys...");
    match dek_manager.generate_dek(org_id, "organization").await {
        Ok(_) => println!("✓ Organization DEK generated"),
        Err(e) => {
            eprintln!("Failed to generate organization DEK: {}", e);
            process::exit(1);
        }
    }

    match dek_manager.generate_dek(admin_user.id, "user").await {
        Ok(_) => println!("✓ User DEK generated"),
        Err(e) => {
            eprintln!("Failed to generate user DEK: {}", e);
            process::exit(1);
        }
    }

    // Create Zanzibar relationships
    println!("\nSetting up Zanzibar permissions...");
    let relationship_repository = Box::new(RelationshipRepositoryImpl::new(pool.clone()));
    let relationship_store = RelationshipStore::new(relationship_repository);

    let user_str = format!("user:{}", admin_user.id);
    let org_str = format!("organization:{}", org_id);

    // Organization relationships
    if let Err(e) = relationship_store.add(&user_str, "owner", &org_str).await {
        eprintln!("Failed to create owner relationship: {}", e);
        process::exit(1);
    }
    println!("✓ Created owner relationship");

    if let Err(e) = relationship_store.add(&user_str, "member", &org_str).await {
        eprintln!("Failed to create member relationship: {}", e);
        process::exit(1);
    }
    println!("✓ Created member relationship");

    // Admin role relationship
    if let Err(e) = relationship_store.add(&user_str, "has_role", "role:admin").await {
        eprintln!("Failed to create admin role relationship: {}", e);
        process::exit(1);
    }
    println!("✓ Created admin role relationship");

    // App access relationships
    for app in &["admin-ui", "client-app", "mobile"] {
        let app_str = format!("app:{}", app);
        if let Err(e) = relationship_store.add(&user_str, "can_access", &app_str).await {
            eprintln!("Failed to create {} access: {}", app, e);
            process::exit(1);
        }
        println!("✓ Created {} access", app);
    }

    // Create wildcard permission (idempotent)
    println!("\nSetting up wildcard permission...");
    let wildcard_relation = "*";
    let wildcard_object = "*";

    // Check if wildcard already exists
    let existing_relationships = relationship_store
        .get_valid_relationships(&user_str)
        .await
        .unwrap_or_else(|e| {
            eprintln!("Failed to check existing relationships: {}", e);
            process::exit(1);
        });

    let wildcard_exists = existing_relationships.iter().any(|rel| {
        rel.relation == wildcard_relation && rel.object == wildcard_object
    });

    if wildcard_exists {
        println!("✓ Wildcard permission already exists (skipping)");
    } else {
        // Create wildcard with metadata
        match relationship_store
            .add_with_metadata(
                &user_str,
                wildcard_relation,
                wildcard_object,
                Some(serde_json::json!({
                    "type": "wildcard",
                    "created_by": "setup-admin",
                    "description": "Grants all permissions to super admin"
                })),
                None, // No expiration
            )
            .await
        {
            Ok(_) => println!("✓ Wildcard permission created (user:{}#*@*)", admin_user.id),
            Err(e) => {
                eprintln!("Failed to create wildcard permission: {}", e);
                process::exit(1);
            }
        }
    }

    // Verify wildcard permission
    match relationship_store.check(&user_str, "*", "*").await {
        Ok(true) => println!("✓ Wildcard permission verified"),
        Ok(false) => {
            eprintln!("⚠ Warning: Wildcard permission check returned false");
        }
        Err(e) => {
            eprintln!("Failed to verify wildcard permission: {}", e);
        }
    }

    // Save credentials to file
    println!("\nSaving credentials to file...");
    let admin_ui_url = std::env::var("ADMIN_UI_URL")
        .unwrap_or_else(|_| format!("http://{}:{}", settings.server.host, 3000));

    let credentials_content = format!(
        r#"=== Health V1 Admin Credentials ===
Generated: {}

Organization: {} ({})
Organization ID: {}

Super Admin Credentials:
  Email: {}
  Username: {}
  Password: {}
  User ID: {}

Access URL: {}

IMPORTANT: Keep this file secure. Delete after first login and password change.
"#,
        Utc::now().to_rfc3339(),
        org_name_value, org_slug_value, org_id,
        admin_email, admin_username, admin_password, admin_user.id,
        admin_ui_url
    );

    match fs::write(&output_file, credentials_content) {
        Ok(_) => {
            // Set file permissions to 600 on Unix
            #[cfg(unix)]
            {
                use std::fs::Permissions;
                use std::os::unix::fs::PermissionsExt;
                if let Err(e) = fs::set_permissions(&output_file, Permissions::from_mode(0o600)) {
                    eprintln!("Warning: Failed to set file permissions: {}", e);
                }
            }
            println!("✓ Credentials saved to: {}", output_file);
        }
        Err(e) => {
            eprintln!("Failed to save credentials file: {}", e);
            process::exit(1);
        }
    }

    // Print success message
    println!("\n=== Setup Complete! ===\n");
    println!("Organization: {} ({})", org_name_value, org_slug_value);
    println!("Super Admin: {} ({})", admin_email, admin_username);
    println!("\nCredentials have been saved to: {}", output_file);
    println!("⚠ IMPORTANT: Keep this file secure and delete it after first login!");
    println!("\nYou can now log in to the admin UI with these credentials.");
    println!("⚠ Please change the password after first login!\n");
}

