use std::process;
use dialoguer::{Input, Password, Select};
use dotenv::dotenv;
use sqlx::PgPool;
use auth_service::config::Settings;
use auth_service::infrastructure::repositories::{
    SetupRepositoryImpl, UserRepositoryImpl,
};
use auth_service::application::use_cases::setup::{
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

    // Connect to database
    println!("Connecting to database...");
    let pool = match PgPool::connect(&settings.database.url).await {
        Ok(p) => {
            println!("✓ Database connected\n");
            p
        }
        Err(e) => {
            eprintln!("Failed to connect to database: {}", e);
            process::exit(1);
        }
    };

    // Run migrations
    println!("Running database migrations...");
    let migrations_dir = std::path::Path::new("./migrations");
    match auth_service::infrastructure::database::migrations::run_migrations(&pool, migrations_dir).await {
        Ok(_) => println!("✓ Migrations completed\n"),
        Err(e) => {
            eprintln!("Failed to run migrations: {}", e);
            process::exit(1);
        }
    }

    // Initialize repositories
    let setup_repository = Box::new(SetupRepositoryImpl::new(pool.clone()));
    let user_repository = Box::new(UserRepositoryImpl::new(pool.clone()));

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

    // Create organization
    println!("\nCreating organization...");
    let setup_org_use_case = SetupOrganizationUseCase::new(
        setup_repository.clone(),
        user_repository.clone(),
    );

    let org_id = match setup_org_use_case
        .execute(&org_name, &org_slug, org_domain.as_deref())
        .await
    {
        Ok(id) => {
            println!("✓ Organization created: {} ({})", org_name, org_slug);
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
        setup_repository.clone(),
        user_repository.clone(),
    );

    match create_admin_use_case
        .execute(&admin_email, &admin_username, &admin_password, Some(org_id))
        .await
    {
        Ok(user) => {
            println!("✓ Super admin created: {} ({})", user.email, user.username);
            println!("\n=== Setup Complete! ===\n");
            println!("Organization: {} ({})", org_name, org_slug);
            println!("Super Admin: {} ({})", admin_email, admin_username);
            println!("\nYou can now log in to the admin UI with these credentials.");
            println!("⚠ Please change the password after first login!\n");
        }
        Err(e) => {
            eprintln!("Failed to create super admin: {}", e);
            process::exit(1);
        }
    }
}

