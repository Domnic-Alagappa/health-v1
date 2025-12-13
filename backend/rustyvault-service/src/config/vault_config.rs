//! Vault-specific configuration extending health-v1 settings

use serde::{Deserialize, Serialize};
use std::env;

/// Vault service settings extending health-v1 configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultSettings {
    // From health-v1
    pub server: ServerConfig,
    pub database: DatabaseConfig,
    pub logging: LoggingConfig,
    pub deployment: DeploymentConfig,

    // RustyVault specific
    pub barrier: BarrierConfig,
    pub seal: SealConfig,
    pub storage: StorageConfig,
    pub mounts: MountsConfig,
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
    pub max_connections: u32,
    pub min_connections: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
    pub rust_log: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentConfig {
    pub environment: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BarrierConfig {
    pub algorithm: String,
    pub key_length: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SealConfig {
    pub secret_shares: u8,
    pub secret_threshold: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    pub backend: String,
    pub path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MountsConfig {
    pub default_lease_ttl: u64,
    pub max_lease_ttl: u64,
}

impl VaultSettings {
    pub fn from_env() -> Result<Self, config::ConfigError> {
        let server = ServerConfig {
            host: env::var("VAULT_SERVER_HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            port: env::var("VAULT_SERVER_PORT")
                .unwrap_or_else(|_| "8200".to_string())
                .parse()
                .unwrap_or(8200),
            cors_allowed_origins: env::var("VAULT_CORS_ORIGINS")
                .unwrap_or_else(|_| "*".to_string())
                .split(',')
                .map(|s| s.trim().to_string())
                .collect(),
        };

        let database = DatabaseConfig {
            url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgresql://localhost/health_v1".to_string()),
            max_connections: env::var("DATABASE_MAX_CONNECTIONS")
                .unwrap_or_else(|_| "10".to_string())
                .parse()
                .unwrap_or(10),
            min_connections: env::var("DATABASE_MIN_CONNECTIONS")
                .unwrap_or_else(|_| "2".to_string())
                .parse()
                .unwrap_or(2),
        };

        let logging = LoggingConfig {
            level: env::var("LOG_LEVEL").unwrap_or_else(|_| "info".to_string()),
            rust_log: env::var("RUST_LOG").unwrap_or_else(|_| "info".to_string()),
        };

        let deployment = DeploymentConfig {
            environment: env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()),
        };

        let barrier = BarrierConfig {
            algorithm: env::var("VAULT_BARRIER_ALGORITHM").unwrap_or_else(|_| "aes-gcm".to_string()),
            key_length: env::var("VAULT_BARRIER_KEY_LENGTH")
                .unwrap_or_else(|_| "32".to_string())
                .parse()
                .unwrap_or(32),
        };

        let seal = SealConfig {
            secret_shares: env::var("VAULT_SECRET_SHARES")
                .unwrap_or_else(|_| "5".to_string())
                .parse()
                .unwrap_or(5),
            secret_threshold: env::var("VAULT_SECRET_THRESHOLD")
                .unwrap_or_else(|_| "3".to_string())
                .parse()
                .unwrap_or(3),
        };

        let storage = StorageConfig {
            backend: env::var("VAULT_STORAGE_BACKEND").unwrap_or_else(|_| "file".to_string()),
            path: env::var("VAULT_STORAGE_PATH").ok(),
        };

        let mounts = MountsConfig {
            default_lease_ttl: env::var("VAULT_DEFAULT_LEASE_TTL")
                .unwrap_or_else(|_| "768h".to_string())
                .parse()
                .unwrap_or(2764800), // 32 days in seconds
            max_lease_ttl: env::var("VAULT_MAX_LEASE_TTL")
                .unwrap_or_else(|_| "768h".to_string())
                .parse()
                .unwrap_or(2764800),
        };

        Ok(VaultSettings {
            server,
            database,
            logging,
            deployment,
            barrier,
            seal,
            storage,
            mounts,
        })
    }
}

