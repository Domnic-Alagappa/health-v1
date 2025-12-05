use crate::config::settings::LoggingConfig;
use crate::config::deployment::DeploymentEnvironment;
use std::env;
use tracing::Level;

/// Logger configuration builder
pub struct LoggerConfig {
    pub level: String,
    pub rust_log: String,
    pub format: LogFormat,
    pub include_location: bool,
    pub is_dev_mode: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogFormat {
    Json,
    Pretty,
}

impl LoggerConfig {
    /// Check if we're in development mode
    fn is_development_mode() -> bool {
        let env_str = env::var("RUST_ENV")
            .unwrap_or_else(|_| "development".to_string())
            .to_lowercase();
        matches!(env_str.as_str(), "dev" | "development")
    }

    /// Create logger config from settings with deployment environment
    pub fn from_settings_with_env(settings: &LoggingConfig, deployment_env: &DeploymentEnvironment) -> Self {
        let is_dev = matches!(deployment_env, DeploymentEnvironment::Development);
        
        // Determine format from environment (default to pretty for dev, json for prod)
        let format = match env::var("LOG_FORMAT")
            .unwrap_or_else(|_| if is_dev { "pretty".to_string() } else { "json".to_string() })
            .to_lowercase()
            .as_str()
        {
            "json" => LogFormat::Json,
            _ => LogFormat::Pretty,
        };

        // Determine log level: use explicit LOG_LEVEL/RUST_LOG if set, otherwise default based on environment
        let default_level = if is_dev { "debug" } else { "info" };
        let level = env::var("LOG_LEVEL")
            .unwrap_or_else(|_| {
                if settings.level.is_empty() {
                    default_level.to_string()
                } else {
                    settings.level.clone()
                }
            });
        
        let rust_log_default = if is_dev { "debug" } else { "info" };
        let rust_log = env::var("RUST_LOG")
            .unwrap_or_else(|_| {
                if settings.rust_log.is_empty() {
                    rust_log_default.to_string()
                } else {
                    settings.rust_log.clone()
                }
            });

        Self {
            level,
            rust_log,
            format,
            include_location: env::var("LOG_INCLUDE_LOCATION")
                .unwrap_or_else(|_| if is_dev { "true".to_string() } else { "false".to_string() })
                .parse()
                .unwrap_or(is_dev),
            is_dev_mode: is_dev,
        }
    }

    /// Create logger config from settings (uses environment to detect dev mode)
    pub fn from_settings(settings: &LoggingConfig) -> Self {
        let deployment_env = match env::var("RUST_ENV")
            .unwrap_or_else(|_| "development".to_string())
            .to_lowercase()
            .as_str()
        {
            "staging" => DeploymentEnvironment::Staging,
            "production" => DeploymentEnvironment::Production,
            _ => DeploymentEnvironment::Development,
        };
        
        Self::from_settings_with_env(settings, &deployment_env)
    }

    /// Create default logger config
    pub fn default() -> Self {
        let is_dev = Self::is_development_mode();
        Self {
            level: if is_dev { "debug".to_string() } else { "info".to_string() },
            rust_log: if is_dev { "debug".to_string() } else { "info".to_string() },
            format: LogFormat::Pretty,
            include_location: true,
            is_dev_mode: is_dev,
        }
    }
    
    /// Check if logger is in dev mode
    pub fn is_dev_mode(&self) -> bool {
        self.is_dev_mode
    }

    /// Get the filter string for tracing
    pub fn get_filter_string(&self) -> String {
        // Use RUST_LOG if set, otherwise use the configured level
        if env::var("RUST_LOG").is_ok() {
            // Will use RUST_LOG from environment
            String::new()
        } else {
            self.rust_log.clone()
        }
    }

    /// Get tracing level from string
    pub fn parse_level(level: &str) -> Level {
        match level.to_lowercase().as_str() {
            "trace" => Level::TRACE,
            "debug" => Level::DEBUG,
            "info" => Level::INFO,
            "warn" => Level::WARN,
            "error" => Level::ERROR,
            _ => Level::INFO,
        }
    }
}

