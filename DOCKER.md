# Docker Setup Guide

This guide explains how to run the Health V1 application stack using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, for convenience commands)

## Quick Start

1. **Create environment file:**
   ```bash
   cp env.docker.example .env
   ```

2. **Review and update `.env` file** with your configuration (especially JWT_SECRET for production!)

3. **Build and start all services:**
   ```bash
   make up-build
   # or
   docker-compose up -d --build
   ```

4. **Check service status:**
   ```bash
   make health
   # or
   docker-compose ps
   ```

5. **View logs:**
   ```bash
   make logs
   # or
   docker-compose logs -f
   ```

## Services

### Core Services (Always Running)
- **PostgreSQL** (port 5432) - Database
- **OpenBao** (port 8200) - Key management service
- **API Service** (port 8080) - Rust backend API
- **Admin UI** (port 5174) - React frontend admin dashboard

### Optional Services (Use Profiles)
- **Client App** (port 5175) - React frontend client application
- **LocalStack** (port 4566) - Local AWS services (S3, KMS)
- **NATS** (port 4225) - Message broker
- **Kafka** (port 9092) - Event streaming platform (KRaft mode)
- **Kafka UI** (port 8081) - Kafka management interface

### Starting Services with Profiles

Start all services including optional ones:
```bash
docker-compose --profile client --profile localstack --profile nats --profile kafka up -d
```

Or start specific profiles:
```bash
# Start with client app
docker-compose --profile client up -d

# Start with LocalStack
docker-compose --profile localstack up -d

# Start with NATS
docker-compose --profile nats up -d

# Start with Kafka
docker-compose --profile kafka up -d
```

## Make Commands

```bash
make build          # Build all Docker images
make up             # Start all services
make up-build       # Build and start all services
make down           # Stop all services
make restart        # Restart all services
make logs           # Show logs from all services
make logs-api       # Show logs from api-service
make logs-admin     # Show logs from admin-ui
make logs-db        # Show logs from postgres
make ps             # Show running containers
make health         # Check health status
make clean          # Remove stopped containers
make clean-volumes  # Remove all volumes (WARNING: deletes data!)
make shell-api      # Open shell in api-service
make shell-admin    # Open shell in admin-ui
make shell-db       # Open PostgreSQL shell
make setup          # Create .env from example
```

## Volume Management

### Clean State (Fresh Start)

To start with a completely clean state:

```bash
# Stop and remove all containers and volumes
make clean-volumes

# Start fresh
make up-build
```

### Persist Data

Data is persisted in Docker volumes:
- `postgres_data` - PostgreSQL database
- `openbao_data` - OpenBao vault data
- `api_service_data` - API service data directory

To remove volumes (WARNING: deletes all data):
```bash
make clean-volumes
```

## Environment Variables

Key environment variables (see `env.docker.example` for full list):

### Required
- `JWT_SECRET` - Secret key for JWT tokens (min 32 chars)
- `POSTGRES_PASSWORD` - Database password

### Optional (with defaults)
- `API_SERVICE_PORT` - Backend API port (default: 8080)
- `ADMIN_UI_PORT` - Frontend port (default: 5174)
- `VAULT_TOKEN` - OpenBao root token (default: dev-root-token)

## Development Workflow

### Running in Development Mode

For development with hot reload, mount source directories:

1. Create `docker-compose.override.yml` (see `docker-compose.override.yml.example`)
2. Mount source directories for hot reload
3. Use development build targets

### Accessing Services

- **Admin UI**: http://localhost:5174
- **Client App**: http://localhost:5175 (when profile `client` is enabled)
- **API Service**: http://localhost:8080
- **API Health**: http://localhost:8080/health
- **OpenBao UI**: http://localhost:8200 (token: dev-root-token)
- **LocalStack**: http://localhost:4566 (when profile `localstack` is enabled)
- **NATS Monitoring**: http://localhost:8225 (when profile `nats` is enabled)
- **Kafka UI**: http://localhost:8081 (when profile `kafka` is enabled)

### Database Access

```bash
# Connect to PostgreSQL
make shell-db

# Or directly
docker-compose exec postgres psql -U auth_user -d auth_db
```

### Running Migrations

Migrations run automatically on api-service startup. To run manually:

```bash
docker-compose exec api-service ./api-service migrate
```

## Troubleshooting

### Services won't start

1. Check logs: `make logs`
2. Verify environment variables: `cat .env`
3. Check port conflicts: `netstat -an | grep -E '8080|5174|5432|8200'`

### Database connection issues

1. Ensure PostgreSQL is healthy: `docker-compose ps postgres`
2. Check DATABASE_URL in .env
3. Verify network connectivity: `docker-compose exec api-service ping postgres`

### Build failures

1. Clear Docker cache: `docker system prune -a`
2. Rebuild without cache: `make build-no-cache`
3. Check Dockerfile syntax and dependencies

### Clean rebuild

```bash
# Remove everything including volumes
make clean-all

# Rebuild from scratch
make up-build
```

## Production Considerations

1. **Change default secrets** in `.env`:
   - `JWT_SECRET` - Use a strong random secret
   - `POSTGRES_PASSWORD` - Use a strong password
   - `VAULT_TOKEN` - Use a secure token

2. **Enable SSL/TLS**:
   - Caddy automatically provides HTTPS (in production with domain)
   - Use reverse proxy (Caddy/Traefik/Nginx) if needed
   - Configure SSL certificates

3. **Resource limits**:
   - Add resource constraints to docker-compose.yml
   - Monitor resource usage

4. **Backup strategy**:
   - Backup volumes regularly
   - Test restore procedures

5. **Security**:
   - Use Docker secrets for sensitive data
   - Implement network policies
   - Regular security updates

## Network Architecture

All services communicate through the `health-network` bridge network:

```
┌─────────────┐
│  Admin UI   │────┐
│  (Caddy)    │    │
└─────────────┘    │
                   │
┌─────────────┐    │     ┌──────────────┐     ┌─────────────┐
│ Client App  │────┼────▶│ API Service  │────▶│  PostgreSQL │
│  (Caddy)    │    │     │   (Rust)     │     │             │
└─────────────┘    │     └──────────────┘     └─────────────┘
                   │             │
                   │             ▼
                   │     ┌──────────────┐
                   │     │   OpenBao    │
                   │     │  (Vault)     │
                   │     └──────────────┘
                   │
       ┌───────────┴──────────────┐
       │                          │
┌──────────────┐          ┌──────────────┐
│  LocalStack  │          │     NATS     │
│  (AWS S3)    │          │  (Broker)    │
└──────────────┘          └──────────────┘
                                   │
                          ┌────────┴────────┐
                          │                 │
                    ┌──────────┐      ┌──────────┐
                    │  Kafka   │      │  Kafka   │
                    │ (KRaft)  │      │   UI     │
                    └──────────┘      └──────────┘
```

## Health Checks

All services have health checks configured:

- **PostgreSQL**: `pg_isready`
- **OpenBao**: HTTP `/v1/sys/health`
- **API Service**: HTTP `/health`
- **Admin UI**: HTTP `/health`

Check health status:
```bash
make health
```

## Logs

View logs for all services:
```bash
make logs
```

View logs for specific service:
```bash
make logs-api     # API service
make logs-admin   # Admin UI
make logs-db      # PostgreSQL
```

Follow logs in real-time:
```bash
docker-compose logs -f [service-name]
```

