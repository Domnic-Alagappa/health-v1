# Docker Services Overview

Complete overview of all services in the Health V1 Docker stack.

## Core Services (Always Running)

These services start by default when running `docker-compose up`:

### 1. PostgreSQL Database
- **Container**: `health-postgres`
- **Image**: `postgres:17-alpine`
- **Port**: 5432
- **Volume**: `postgres_data`
- **Purpose**: Primary database for auth-service
- **Health Check**: `pg_isready`

### 2. OpenBao (Vault)
- **Container**: `health-openbao`
- **Image**: `openbao/openbao:latest`
- **Port**: 8200
- **Volume**: `openbao_data`
- **Purpose**: Key management and secrets storage
- **Health Check**: HTTP `/v1/sys/health`
- **Default Token**: `dev-root-token` (change in production!)

### 3. Auth Service (Rust Backend)
- **Container**: `health-auth-service`
- **Image**: Built from `./auth-service/Dockerfile`
- **Port**: 8080
- **Volume**: `auth_service_data`
- **Purpose**: Authentication and authorization API
- **Health Check**: HTTP `/health`
- **Dependencies**: PostgreSQL, OpenBao

### 4. Admin UI (React Frontend)
- **Container**: `health-admin-ui`
- **Image**: Built from `./cli/packages/apps/admin/Dockerfile`
- **Web Server**: Caddy
- **Port**: 5174
- **Purpose**: Admin dashboard for system management
- **Health Check**: HTTP `/health`
- **Dependencies**: Auth Service

## Optional Services (Profile-Based)

These services only start when their profile is enabled:

### 5. Client App (React Frontend)
- **Container**: `health-client-app`
- **Image**: Built from `./cli/packages/apps/client-app/Dockerfile`
- **Web Server**: Caddy
- **Port**: 5175
- **Profile**: `client`
- **Purpose**: Main client application frontend
- **Health Check**: HTTP `/health`
- **Start**: `docker-compose --profile client up -d`

### 6. LocalStack (AWS Services)
- **Container**: `health-localstack`
- **Image**: `localstack/localstack:latest`
- **Port**: 4566
- **Volume**: `localstack_data`
- **Profile**: `localstack`
- **Purpose**: Local AWS services (S3, KMS, etc.)
- **Services**: S3, KMS (configurable via `LOCALSTACK_SERVICES`)
- **Health Check**: HTTP `/_localstack/health`
- **Start**: `docker-compose --profile localstack up -d`

### 7. NATS (Message Broker)
- **Container**: `health-nats`
- **Image**: `nats:latest`
- **Ports**: 
  - 4222 (client connections)
  - 8222 (HTTP monitoring)
  - 6222 (cluster routing)
- **Profile**: `nats`
- **Purpose**: Lightweight message broker with JetStream
- **Health Check**: HTTP `/healthz` on port 8222
- **Start**: `docker-compose --profile nats up -d`

### 8. Zookeeper
- **Container**: `health-zookeeper`
- **Image**: `confluentinc/cp-zookeeper:latest`
- **Port**: 2181
- **Profile**: `kafka`
- **Purpose**: Coordination service for Kafka
- **Dependencies**: None
- **Start**: Included with `kafka` profile

### 9. Kafka
- **Container**: `health-kafka`
- **Image**: `confluentinc/cp-kafka:latest`
- **Ports**: 
  - 9092 (external)
  - 29092 (internal)
- **Profile**: `kafka`
- **Purpose**: Distributed event streaming platform
- **Health Check**: Kafka broker API check
- **Dependencies**: Zookeeper
- **Start**: `docker-compose --profile kafka up -d`

### 10. Kafka UI
- **Container**: `health-kafka-ui`
- **Image**: `provectuslabs/kafka-ui:latest`
- **Port**: 8081
- **Profile**: `kafka`
- **Purpose**: Web UI for managing and monitoring Kafka
- **Dependencies**: Kafka, Zookeeper
- **Start**: Included with `kafka` profile

## Service Communication

### Internal Network
All services communicate through the `health-network` bridge network. Use service names as hostnames:

- `postgres:5432` - Database connection
- `openbao:8200` - Vault connection
- `localstack:4566` - AWS services
- `nats:4222` - NATS connection
- `kafka:29092` - Kafka internal connection

### External Access
Ports are exposed to localhost for external access. Configure via environment variables.

## Quick Start Commands

```bash
# Start core services only
make up-build

# Start all services including optional ones
make up-build-all

# Start with specific profiles
docker-compose --profile client up -d
docker-compose --profile localstack up -d
docker-compose --profile nats up -d
docker-compose --profile kafka up -d

# Start multiple profiles
docker-compose --profile client --profile localstack up -d

# Check service status
make health
docker-compose ps

# View logs
make logs
docker-compose logs -f [service-name]

# Stop all services
make down

# Clean everything including volumes
make clean-volumes
```

## Service URLs

### Core Services
- **Admin UI**: http://localhost:5174
- **Auth API**: http://localhost:8080
- **API Health**: http://localhost:8080/health
- **OpenBao UI**: http://localhost:8200
- **PostgreSQL**: localhost:5432

### Optional Services
- **Client App**: http://localhost:5175 (profile: `client`)
- **LocalStack**: http://localhost:4566 (profile: `localstack`)
- **NATS Monitoring**: http://localhost:8222 (profile: `nats`)
- **Kafka UI**: http://localhost:8081 (profile: `kafka`)

## Volume Management

### Persistent Volumes
- `postgres_data` - Database data
- `openbao_data` - Vault data
- `auth_service_data` - Auth service data
- `localstack_data` - LocalStack data

### Clean State
To start with fresh data:
```bash
make clean-volumes
make up-build
```

**Warning**: This deletes all persistent data!

## Environment Configuration

All configuration is done via environment variables. See `env.docker.example` for all available options.

Key variables:
- Service enable flags: `ENABLE_POSTGRES`, `ENABLE_OPENBAO_SERVICE`, etc.
- Service ports: `AUTH_SERVICE_PORT`, `ADMIN_UI_PORT`, etc.
- Connection URLs: `DATABASE_URL`, `VAULT_ADDR`, etc.

## Health Checks

All services have health checks configured:
- PostgreSQL: Database connection check
- OpenBao: HTTP health endpoint
- Auth Service: HTTP `/health`
- Admin/Client UI: HTTP `/health`
- LocalStack: HTTP health endpoint
- NATS: HTTP monitoring endpoint
- Kafka: Broker API check

Check all health status:
```bash
make health
```

## Troubleshooting

### Service won't start
1. Check logs: `docker-compose logs [service-name]`
2. Verify dependencies are healthy
3. Check environment variables
4. Verify ports aren't in use

### Service connectivity issues
1. Verify services are on the same network: `docker network inspect health-network`
2. Check service names match Docker service names
3. Verify health checks are passing

### Port conflicts
Check if ports are already in use:
```bash
lsof -i :8080  # Auth service
lsof -i :5174  # Admin UI
lsof -i :5432  # PostgreSQL
```

## Production Considerations

1. **Change all default secrets**:
   - `JWT_SECRET` - Use strong random secret
   - `POSTGRES_PASSWORD` - Strong password
   - `VAULT_TOKEN` - Secure token

2. **Resource Limits**:
   - Add resource constraints to services
   - Monitor resource usage

3. **Security**:
   - Use Docker secrets for sensitive data
   - Implement network policies
   - Enable TLS/SSL for all services

4. **Backup Strategy**:
   - Regular volume backups
   - Test restore procedures

5. **Monitoring**:
   - Set up logging aggregation
   - Monitor service health
   - Track metrics

