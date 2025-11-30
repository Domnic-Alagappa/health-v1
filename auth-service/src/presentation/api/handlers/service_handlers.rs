use axum::{Json, extract::State, http::StatusCode, response::IntoResponse};
use chrono::Utc;
use crate::application::dto::{ServiceStatusResponse, ServiceInfo};
use crate::shared::AppState;
use std::sync::Arc;
use std::env;
use std::time::Duration;

/// Helper function to parse boolean environment variable
fn parse_bool_env(key: &str, default: bool) -> bool {
    env::var(key)
        .ok()
        .and_then(|v| {
            match v.to_lowercase().as_str() {
                "true" | "1" | "yes" | "on" => Some(true),
                "false" | "0" | "no" | "off" => Some(false),
                _ => None,
            }
        })
        .unwrap_or(default)
}

/// Check PostgreSQL health using DatabaseService
async fn check_postgres_health(db_service: &crate::infrastructure::database::DatabaseService) -> (bool, Option<String>) {
    use std::time::Duration;
    match db_service.health_check_with_timeout(Duration::from_secs(5)).await {
        Ok(true) => (true, None),
        Ok(false) => (false, Some("Database health check returned false".to_string())),
        Err(e) => (false, Some(format!("Database connection failed: {}", e))),
    }
}

/// Check OpenBao health
async fn check_openbao_health() -> (bool, Option<String>, Option<String>) {
    let vault_addr = env::var("VAULT_ADDR").unwrap_or_else(|_| "http://localhost:8200".to_string());
    let health_endpoint = format!("{}/v1/sys/health", vault_addr);
    
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build();
    
    match client {
        Ok(client) => {
            match client.get(&health_endpoint).send().await {
                Ok(response) => {
                    if response.status().is_success() {
                        (true, Some(health_endpoint), None)
                    } else {
                        (false, Some(health_endpoint), Some(format!("Health check returned status: {}", response.status())))
                    }
                }
                Err(e) => (false, Some(health_endpoint), Some(format!("Request failed: {}", e))),
            }
        }
        Err(e) => (false, Some(health_endpoint), Some(format!("Failed to create HTTP client: {}", e))),
    }
}

/// Check LocalStack health
async fn check_localstack_health() -> (bool, Option<String>, Option<String>) {
    let endpoint = env::var("AWS_S3_ENDPOINT")
        .unwrap_or_else(|_| "http://localhost:4566".to_string());
    let health_endpoint = format!("{}/_localstack/health", endpoint);
    
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build();
    
    match client {
        Ok(client) => {
            match client.get(&health_endpoint).send().await {
                Ok(response) => {
                    if response.status().is_success() {
                        (true, Some(health_endpoint), None)
                    } else {
                        (false, Some(health_endpoint), Some(format!("Health check returned status: {}", response.status())))
                    }
                }
                Err(e) => (false, Some(health_endpoint), Some(format!("Request failed: {}", e))),
            }
        }
        Err(e) => (false, Some(health_endpoint), Some(format!("Failed to create HTTP client: {}", e))),
    }
}

/// Check NATS health
async fn check_nats_health() -> (bool, Option<String>, Option<String>) {
    let nats_port = env::var("NATS_HTTP_PORT").unwrap_or_else(|_| "8222".to_string());
    let health_endpoint = format!("http://localhost:{}/healthz", nats_port);
    
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build();
    
    match client {
        Ok(client) => {
            match client.get(&health_endpoint).send().await {
                Ok(response) => {
                    if response.status().is_success() {
                        (true, Some(health_endpoint), None)
                    } else {
                        (false, Some(health_endpoint), Some(format!("Health check returned status: {}", response.status())))
                    }
                }
                Err(e) => (false, Some(health_endpoint), Some(format!("Request failed: {}", e))),
            }
        }
        Err(e) => (false, Some(health_endpoint), Some(format!("Failed to create HTTP client: {}", e))),
    }
}

/// Check Kafka health (simple TCP connection check)
async fn check_kafka_health() -> (bool, Option<String>, Option<String>) {
    let kafka_url = env::var("KAFKA_BOOTSTRAP_SERVERS")
        .unwrap_or_else(|_| "localhost:9092".to_string());
    
    // Parse host and port from bootstrap servers (take first server)
    let parts: Vec<&str> = kafka_url.split(',').next().unwrap_or(&kafka_url).split(':').collect();
    if parts.len() != 2 {
        return (false, Some(kafka_url.clone()), Some("Invalid KAFKA_BOOTSTRAP_SERVERS format".to_string()));
    }
    
    let host = parts[0];
    let port: u16 = parts[1].parse().unwrap_or(9092);
    
    // Try to connect to Kafka broker
    let health_endpoint = format!("{}:{}", host, port);
    match tokio::net::TcpStream::connect(&health_endpoint).await {
        Ok(_) => (true, Some(health_endpoint), None),
        Err(e) => (false, Some(health_endpoint), Some(format!("Connection failed: {}", e))),
    }
}

/// Get service status
pub async fn get_service_status(
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    let checked_at = Utc::now().to_rfc3339();
    let mut services = Vec::new();
    let mut operational_count = 0;
    let mut enabled_count = 0;

    // Check PostgreSQL
    let postgres_enabled = parse_bool_env("ENABLE_POSTGRES", true);
    enabled_count += if postgres_enabled { 1 } else { 0 };
    
    let (postgres_operational, postgres_error) = if postgres_enabled {
        let (operational, error) = check_postgres_health(&state.database_service).await;
        if operational {
            operational_count += 1;
        }
        (operational, error)
    } else {
        (false, None)
    };
    
    services.push(ServiceInfo {
        name: "PostgreSQL".to_string(),
        enabled: postgres_enabled,
        operational: postgres_operational,
        health_endpoint: None,
        last_checked: Some(checked_at.clone()),
        error: postgres_error,
    });

    // Check OpenBao
    let openbao_enabled = parse_bool_env("ENABLE_OPENBAO_SERVICE", true);
    enabled_count += if openbao_enabled { 1 } else { 0 };
    
    let (openbao_operational, openbao_endpoint, openbao_error) = if openbao_enabled {
        let (operational, endpoint, error) = check_openbao_health().await;
        if operational {
            operational_count += 1;
        }
        (operational, endpoint, error)
    } else {
        (false, None, None)
    };
    
    services.push(ServiceInfo {
        name: "OpenBao".to_string(),
        enabled: openbao_enabled,
        operational: openbao_operational,
        health_endpoint: openbao_endpoint,
        last_checked: Some(checked_at.clone()),
        error: openbao_error,
    });

    // Check LocalStack
    let localstack_enabled = parse_bool_env("ENABLE_LOCALSTACK", true);
    enabled_count += if localstack_enabled { 1 } else { 0 };
    
    let (localstack_operational, localstack_endpoint, localstack_error) = if localstack_enabled {
        let (operational, endpoint, error) = check_localstack_health().await;
        if operational {
            operational_count += 1;
        }
        (operational, endpoint, error)
    } else {
        (false, None, None)
    };
    
    services.push(ServiceInfo {
        name: "LocalStack".to_string(),
        enabled: localstack_enabled,
        operational: localstack_operational,
        health_endpoint: localstack_endpoint,
        last_checked: Some(checked_at.clone()),
        error: localstack_error,
    });

    // Check NATS
    let nats_enabled = parse_bool_env("ENABLE_NATS", false);
    enabled_count += if nats_enabled { 1 } else { 0 };
    
    let (nats_operational, nats_endpoint, nats_error) = if nats_enabled {
        let (operational, endpoint, error) = check_nats_health().await;
        if operational {
            operational_count += 1;
        }
        (operational, endpoint, error)
    } else {
        (false, None, None)
    };
    
    services.push(ServiceInfo {
        name: "NATS".to_string(),
        enabled: nats_enabled,
        operational: nats_operational,
        health_endpoint: nats_endpoint,
        last_checked: Some(checked_at.clone()),
        error: nats_error,
    });

    // Check Kafka
    let kafka_enabled = parse_bool_env("ENABLE_KAFKA", false);
    enabled_count += if kafka_enabled { 1 } else { 0 };
    
    let (kafka_operational, kafka_endpoint, kafka_error) = if kafka_enabled {
        let (operational, endpoint, error) = check_kafka_health().await;
        if operational {
            operational_count += 1;
        }
        (operational, endpoint, error)
    } else {
        (false, None, None)
    };
    
    services.push(ServiceInfo {
        name: "Kafka".to_string(),
        enabled: kafka_enabled,
        operational: kafka_operational,
        health_endpoint: kafka_endpoint,
        last_checked: Some(checked_at.clone()),
        error: kafka_error,
    });

    // Determine overall status
    let overall_status = if enabled_count == 0 {
        "unknown".to_string()
    } else if operational_count == enabled_count {
        "operational".to_string()
    } else if operational_count > 0 {
        "degraded".to_string()
    } else {
        "down".to_string()
    };

    (
        StatusCode::OK,
        Json(ServiceStatusResponse {
            services,
            overall_status,
            checked_at,
        }),
    )
        .into_response()
}

