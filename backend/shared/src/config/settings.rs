use serde::{Deserialize, Serialize};
use std::env;
use crate::config::deployment::DeploymentConfig;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub encryption: EncryptionConfig,
    pub oidc: OidcConfig,
    pub storage: StorageConfig,
    pub logging: LoggingConfig,
    pub deployment: DeploymentConfig,
    pub session: SessionConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub host: String,
    pub port: u16,
    pub cors_allowed_origins: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub local_db_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EncryptionConfig {
    pub master_key_path: Option<String>,
    pub kms_provider: String,
    pub kms_config_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OidcConfig {
    pub issuer: String,
    pub client_id: String,
    pub client_secret: String,
    pub jwt_secret: String,
    pub jwt_expiration: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    pub provider: String,
    pub config_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
    pub rust_log: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SessionConfig {
    pub admin_ui_ttl_hours: u64,
    pub client_ui_ttl_hours: u64,
    pub api_ttl_hours: u64,
    pub admin_ui_cors_origins: Vec<String>,
    pub client_ui_cors_origins: Vec<String>,
}

impl Settings {
    pub fn from_env() -> Result<Self, config::ConfigError> {
        let server = ServerConfig {
            host: env::var("SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("SERVER_PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .unwrap_or(8080),
            cors_allowed_origins: env::var("CORS_ALLOWED_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:5174,http://localhost:5173,http://localhost:5175".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect(),
        };

        let database = DatabaseConfig {
            url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://user:password@localhost:5432/auth_db".to_string()),
            local_db_path: env::var("LOCAL_DB_PATH").unwrap_or_else(|_| "./data/local.db".to_string()),
        };

        let encryption = EncryptionConfig {
            master_key_path: env::var("MASTER_KEY_PATH").ok(),
            kms_provider: env::var("KMS_PROVIDER").unwrap_or_else(|_| "hashicorp".to_string()),
            kms_config_path: env::var("KMS_CONFIG_PATH").ok(),
        };

        let oidc = OidcConfig {
            issuer: env::var("OIDC_ISSUER").unwrap_or_else(|_| "http://localhost:8080".to_string()),
            client_id: env::var("OIDC_CLIENT_ID").unwrap_or_else(|_| "default-client".to_string()),
            client_secret: env::var("OIDC_CLIENT_SECRET")
                .unwrap_or_else(|_| "default-secret".to_string()),
            jwt_secret: env::var("JWT_SECRET")
                .expect("JWT_SECRET must be set"),
            jwt_expiration: env::var("JWT_EXPIRATION")
                .unwrap_or_else(|_| "3600".to_string())
                .parse()
                .unwrap_or(3600),
        };

        let storage = StorageConfig {
            provider: env::var("STORAGE_PROVIDER").unwrap_or_else(|_| "local".to_string()),
            config_path: env::var("STORAGE_CONFIG_PATH").ok(),
        };

        let logging = LoggingConfig {
            level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            rust_log: env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
        };

        let deployment = DeploymentConfig::from_env()?;

        let session = SessionConfig {
            admin_ui_ttl_hours: env::var("SESSION_ADMIN_UI_TTL_HOURS")
                .unwrap_or_else(|_| "8".to_string())
                .parse()
                .unwrap_or(8),
            client_ui_ttl_hours: env::var("SESSION_CLIENT_UI_TTL_HOURS")
                .unwrap_or_else(|_| "24".to_string())
                .parse()
                .unwrap_or(24),
            api_ttl_hours: env::var("SESSION_API_TTL_HOURS")
                .unwrap_or_else(|_| "1".to_string())
                .parse()
                .unwrap_or(1),
            admin_ui_cors_origins: env::var("CORS_ADMIN_UI_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:5174".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect(),
            client_ui_cors_origins: env::var("CORS_CLIENT_UI_ORIGINS")
                .unwrap_or_else(|_| "http://localhost:5175".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect(),
        };

        Ok(Settings {
            server,
            database,
            encryption,
            oidc,
            storage,
            logging,
            deployment,
            session,
        })
    }
}

