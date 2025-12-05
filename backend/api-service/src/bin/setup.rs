use std::process;
use dialoguer::{Input, Password, Select};
use dotenv::dotenv;
use shared::config::Settings;
use shared::infrastructure::database::{create_pool, DatabaseService};
use shared::infrastructure::repositories::{
    SetupRepositoryImpl, UserRepositoryImpl,
};
use shared::domain::repositories::SetupRepository;
use admin_service::use_cases::setup::{
    SetupOrganizationUseCase, CreateSuperAdminUseCase,
};

#[tokio::main]
async fn main() {
    // Load environment variables
    dotenv().ok();

    // Initialize tracing
    tracing_subscriber::fmt::init();

    println!("=== Health V1 Initial Setup ===\n");

    // Load configuration
    let settings = match Settings::from_env() {
        Ok(s) => s,
        Err(e) => {
            eprintln!("Failed to load configuration: {}", e);
            process::exit(1);
        }
    };

    // Connect to database using database service
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

    // Run migrations using sqlx's built-in migrator
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

    if is_completed {
        println!("⚠ Setup has already been completed!");
        let options = vec!["Exit", "Continue anyway (not recommended)"];
        let selection = Select::new()
            .with_prompt("What would you like to do?")
            .items(&options)
            .default(0)
            .interact()
            .unwrap_or(0);

        if selection == 0 {
            println!("Exiting...");
            process::exit(0);
        }
        println!();
    } else {
        // Clean up any orphaned data from previous failed setup attempts
        println!("Checking for orphaned data from previous setup attempts...");
        
        // Find and delete any users that are super users but setup wasn't completed
        // (these are likely from failed setup attempts)
        if let Err(e) = sqlx::query(
            r#"
            DELETE FROM users 
            WHERE is_super_user = true 
            AND id NOT IN (
                SELECT setup_completed_by 
                FROM setup_status 
                WHERE setup_completed = true 
                AND setup_completed_by IS NOT NULL
            )
            "#
        )
        .execute(&pool)
        .await
        {
            eprintln!("Warning: Failed to clean up orphaned users: {}", e);
        } else {
            println!("✓ Cleaned up orphaned users (if any)");
        }
        
        // Delete any organizations that don't have any users
        // (these are likely from failed setup attempts)
        if let Err(e) = sqlx::query(
            r#"
            DELETE FROM organizations 
            WHERE id NOT IN (
                SELECT DISTINCT organization_id 
                FROM users 
                WHERE organization_id IS NOT NULL
            )
            "#
        )
        .execute(&pool)
        .await
        {
            eprintln!("Warning: Failed to clean up orphaned organizations: {}", e);
        } else {
            println!("✓ Cleaned up orphaned organizations (if any)");
        }
        
        println!();
    }

    // Collect organization information
    println!("=== Organization Setup ===\n");
    
    let org_name: String = Input::new()
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
        });

    let org_slug: String = Input::new()
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
        });

    let org_domain: Option<String> = Input::new()
        .with_prompt("Organization domain (optional, press Enter to skip)")
        .allow_empty(true)
        .interact_text()
        .ok()
        .filter(|s: &String| !s.trim().is_empty());

    // Collect super admin information
    println!("\n=== Super Admin Setup ===\n");

    let admin_email: String = Input::new()
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
        });

    let admin_username: String = Input::new()
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
        });

    let admin_password = Password::new()
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
        });

    // Helper function to rollback everything
    async fn rollback_all(pool: &sqlx::PgPool, org_id: Option<uuid::Uuid>, user_id: Option<uuid::Uuid>) {
        println!("\n=== Rolling back all changes ===");
        let mut errors = Vec::new();
        
        // Delete user if it was created
        if let Some(uid) = user_id {
            println!("Removing user...");
            if let Err(e) = sqlx::query("DELETE FROM users WHERE id = $1")
                .bind(uid)
                .execute(pool)
                .await
            {
                errors.push(format!("Failed to delete user {}: {}", uid, e));
                eprintln!("✗ Failed to delete user: {}", e);
            } else {
                println!("✓ User removed");
            }
        }
        
        // Delete organization if it was created
        if let Some(oid) = org_id {
            println!("Removing organization...");
            if let Err(e) = sqlx::query("DELETE FROM organizations WHERE id = $1")
                .bind(oid)
                .execute(pool)
                .await
            {
                errors.push(format!("Failed to delete organization {}: {}", oid, e));
                eprintln!("✗ Failed to delete organization: {}", e);
            } else {
                println!("✓ Organization removed");
            }
        }
        
        // Reset setup status
        println!("Resetting setup status...");
        if let Err(e) = sqlx::query(
            r#"
            UPDATE setup_status 
            SET setup_completed = false, 
                setup_completed_at = NULL, 
                setup_completed_by = NULL 
            WHERE setup_completed = true
            "#
        )
        .execute(pool)
        .await
        {
            errors.push(format!("Failed to reset setup status: {}", e));
            eprintln!("✗ Failed to reset setup status: {}", e);
        } else {
            println!("✓ Setup status reset");
        }
        
        if errors.is_empty() {
            println!("\n✓ All changes rolled back successfully");
        } else {
            println!("\n⚠ Some cleanup operations failed. Manual cleanup may be required:");
            for error in &errors {
                eprintln!("  - {}", error);
            }
        }
    }

    // Create organization
    println!("\nCreating organization...");
    let setup_org_use_case = SetupOrganizationUseCase::new(
        Box::new(SetupRepositoryImpl::new(pool.clone())),
        Box::new(UserRepositoryImpl::new(database_service.clone())),
    );

    // Track what we create for rollback
    let org_id = match setup_org_use_case
        .execute(&org_name, &org_slug, org_domain.as_deref(), false)
        .await
    {
        Ok(id) => {
            println!("✓ Organization created: {} ({})", org_name, org_slug);
            Some(id)
        }
        Err(e) => {
            eprintln!("Failed to create organization: {}", e);
            process::exit(1);
        }
    };

    // Create super admin
    // If this fails, we need to clean up everything
    println!("Creating super admin user...");
    let create_admin_use_case = CreateSuperAdminUseCase::new(
        Box::new(SetupRepositoryImpl::new(pool.clone())),
        Box::new(UserRepositoryImpl::new(database_service.clone())),
    );

    match create_admin_use_case
        .execute(&admin_email, &admin_username, &admin_password, org_id)
        .await
    {
        Ok(user) => {
            let _user_id = Some(user.id);
            println!("✓ Super admin created: {} ({})", user.email, user.username);
            println!("\n=== Setup Complete! ===\n");
            println!("Organization: {} ({})", org_name, org_slug);
            println!("Super Admin: {} ({})", admin_email, admin_username);
            println!("\nYou can now log in to the admin UI with these credentials.");
            println!("⚠ Please change the password after first login!\n");
        }
        Err(e) => {
            eprintln!("Failed to create super admin: {}", e);
            rollback_all(&pool, org_id, None).await;
            process::exit(1);
        }
    }
}

