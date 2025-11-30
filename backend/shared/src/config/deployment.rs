use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeploymentConfig {
    pub environment: DeploymentEnvironment,
    pub cloud_provider: CloudProvider,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DeploymentEnvironment {
    Development,
    Staging,
    Production,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CloudProvider {
    None,
    Aws,
    Gcp,
    Azure,
}

impl DeploymentConfig {
    pub fn from_env() -> Result<Self, config::ConfigError> {
        let env_str = env::var("DEPLOYMENT_ENV").unwrap_or_else(|_| "development".to_string());
        let environment = match env_str.as_str() {
            "staging" => DeploymentEnvironment::Staging,
            "production" => DeploymentEnvironment::Production,
            _ => DeploymentEnvironment::Development,
        };

        let cloud_str = env::var("CLOUD_PROVIDER").unwrap_or_else(|_| "none".to_string());
        let cloud_provider = match cloud_str.as_str() {
            "aws" => CloudProvider::Aws,
            "gcp" => CloudProvider::Gcp,
            "azure" => CloudProvider::Azure,
            _ => CloudProvider::None,
        };

        Ok(DeploymentConfig {
            environment,
            cloud_provider,
        })
    }
}

