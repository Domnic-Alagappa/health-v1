use crate::config::settings::LoggingConfig;
use std::env;
use tracing::Level;

/// Logger configuration builder
pub struct LoggerConfig {
    pub level: String,
    pub rust_log: String,
    pub format: LogFormat,
    pub include_location: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogFormat {
    Json,
    Pretty,
}

impl LoggerConfig {
    /// Create logger config from settings
    pub fn from_settings(settings: &LoggingConfig) -> Self {
        // Determine format from environment (default to pretty for dev)
        let format = match env::var("LOG_FORMAT")
            .unwrap_or_else(|_| "pretty".to_string())
            .to_lowercase()
            .as_str()
        {
            "json" => LogFormat::Json,
            _ => LogFormat::Pretty,
        };

        Self {
            level: settings.level.clone(),
            rust_log: settings.rust_log.clone(),
            format,
            include_location: env::var("LOG_INCLUDE_LOCATION")
                .unwrap_or_else(|_| "true".to_string())
                .parse()
                .unwrap_or(true),
        }
    }

    /// Create default logger config
    pub fn default() -> Self {
        Self {
            level: "info".to_string(),
            rust_log: "info".to_string(),
            format: LogFormat::Pretty,
            include_location: true,
        }
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

