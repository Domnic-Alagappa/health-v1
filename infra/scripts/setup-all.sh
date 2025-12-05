#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PROJECT_ROOT="$(cd "${INFRA_DIR}/.." && pwd)"

# Helper function to parse boolean environment variables
# Supports: true, 1, yes, on (case insensitive) → true
#           false, 0, no, off, empty → false
is_enabled() {
    local var_value="${!1:-false}"
    local lower_value=$(echo "$var_value" | tr '[:upper:]' '[:lower:]' | xargs)
    case "$lower_value" in
        true|1|yes|on) return 0 ;;
        *) return 1 ;;
    esac
}

echo "=========================================="
echo "Setting up all local infrastructure services"
echo "=========================================="

# Load environment variables if .env exists in project root
if [ -f "${PROJECT_ROOT}/.env" ]; then
    echo "Loading .env file from project root..."
    export $(cat "${PROJECT_ROOT}/.env" | grep -v '^#' | xargs)
elif [ -f "${PROJECT_ROOT}/env.example" ]; then
    echo "Found env.example file. Copy it to .env to customize settings."
fi

# Check which services are enabled and build profile list
PROFILES=()
SERVICES_ENABLED=()

if is_enabled "ENABLE_POSTGRES"; then
    PROFILES+=("--profile" "postgres")
    SERVICES_ENABLED+=("postgres")
fi

if is_enabled "ENABLE_LOCALSTACK"; then
    PROFILES+=("--profile" "localstack")
    SERVICES_ENABLED+=("localstack")
fi

if is_enabled "ENABLE_OPENBAO_SERVICE"; then
    PROFILES+=("--profile" "openbao")
    SERVICES_ENABLED+=("openbao")
fi

if is_enabled "ENABLE_NATS"; then
    PROFILES+=("--profile" "nats")
    SERVICES_ENABLED+=("nats")
fi

if is_enabled "ENABLE_KAFKA"; then
    PROFILES+=("--profile" "kafka")
    SERVICES_ENABLED+=("kafka")
fi

# Start services from infra directory
echo ""
echo "Starting Docker Compose services..."
echo "Enabled services: ${SERVICES_ENABLED[*]:-none}"
cd "${INFRA_DIR}"

if [ ${#PROFILES[@]} -eq 0 ]; then
    echo "Warning: No services enabled. Please set ENABLE_* flags in your .env file."
    echo "Available flags: ENABLE_POSTGRES, ENABLE_LOCALSTACK, ENABLE_OPENBAO_SERVICE, ENABLE_NATS, ENABLE_KAFKA"
    exit 1
fi

docker-compose "${PROFILES[@]}" up -d

# Wait a bit for services to initialize
echo ""
echo "Waiting for services to initialize..."
sleep 10

# Setup services only if they are enabled
if is_enabled "ENABLE_OPENBAO_SERVICE"; then
    echo ""
    echo "=========================================="
    echo "Setting up OpenBao..."
    echo "=========================================="
    if [ -f "${INFRA_DIR}/openbao-init/init.sh" ]; then
        chmod +x "${INFRA_DIR}/openbao-init/init.sh"
        bash "${INFRA_DIR}/openbao-init/init.sh" || {
            echo "OpenBao setup had issues, but continuing..."
        }
    fi
fi

if is_enabled "ENABLE_LOCALSTACK"; then
    echo ""
    echo "=========================================="
    echo "Setting up LocalStack (S3)..."
    echo "=========================================="
    if [ -f "${SCRIPT_DIR}/setup-localstack.sh" ]; then
        chmod +x "${SCRIPT_DIR}/setup-localstack.sh"
        bash "${SCRIPT_DIR}/setup-localstack.sh" || {
            echo "LocalStack setup had issues, but continuing..."
        }
    fi
fi

if is_enabled "ENABLE_NATS"; then
    echo ""
    echo "=========================================="
    echo "Setting up NATS..."
    echo "=========================================="
    if [ -f "${SCRIPT_DIR}/setup-nats.sh" ]; then
        chmod +x "${SCRIPT_DIR}/setup-nats.sh"
        bash "${SCRIPT_DIR}/setup-nats.sh" || {
            echo "NATS setup had issues, but continuing..."
        }
    fi
fi

if is_enabled "ENABLE_KAFKA"; then
    echo ""
    echo "=========================================="
    echo "Setting up Kafka..."
    echo "=========================================="
    if [ -f "${SCRIPT_DIR}/setup-kafka.sh" ]; then
        chmod +x "${SCRIPT_DIR}/setup-kafka.sh"
        bash "${SCRIPT_DIR}/setup-kafka.sh" || {
            echo "Kafka setup had issues, but continuing..."
        }
    fi
fi

echo ""
echo "=========================================="
echo "Infrastructure setup complete!"
echo "=========================================="
echo ""
echo "Enabled services: ${SERVICES_ENABLED[*]}"
echo ""
echo "Service endpoints:"
if is_enabled "ENABLE_POSTGRES"; then
    echo "  - PostgreSQL:    localhost:${POSTGRES_PORT:-5432}"
fi
if is_enabled "ENABLE_OPENBAO_SERVICE"; then
    echo "  - OpenBao:       ${VAULT_ADDR:-http://localhost:8200}"
fi
if is_enabled "ENABLE_LOCALSTACK"; then
    echo "  - LocalStack:    ${AWS_S3_ENDPOINT:-http://localhost:4566}"
fi
if is_enabled "ENABLE_NATS"; then
    echo "  - NATS:          ${NATS_URL:-nats://localhost:4225}"
fi
if is_enabled "ENABLE_KAFKA"; then
    echo "  - Kafka:         ${KAFKA_BOOTSTRAP_SERVERS:-localhost:9092}"
    echo "  - Kafka UI:      http://localhost:8081"
fi
echo ""
echo "To stop services: cd infra && docker-compose ${PROFILES[*]} down"
echo "To view logs: cd infra && docker-compose ${PROFILES[*]} logs -f"

