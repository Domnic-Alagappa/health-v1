pub mod config;
pub mod context;
pub mod formatter;

pub use config::{LogFormat, LoggerConfig};
pub use context::{LogContext, span_with_context, span_from_request_context};
pub use formatter::{init_logger, init_default};

use crate::config::settings::LoggingConfig;
use crate::config::deployment::DeploymentConfig;

/// Check if running in development mode (single point of control)
pub fn is_dev_mode() -> bool {
    let env_str = std::env::var("RUST_ENV")
        .unwrap_or_else(|_| "development".to_string())
        .to_lowercase();
    matches!(env_str.as_str(), "dev" | "development")
}

/// Initialize the logger from application settings
pub fn init_from_settings(settings: &LoggingConfig) {
    let config = LoggerConfig::from_settings(settings);
    formatter::init_logger(&config);
}

/// Initialize the logger from application settings with deployment config
pub fn init_from_settings_with_deployment(settings: &LoggingConfig, deployment: &DeploymentConfig) {
    let config = LoggerConfig::from_settings_with_env(settings, &deployment.environment);
    formatter::init_logger(&config);
}

