# Infrastructure Services

This directory contains all third-party infrastructure services used for local development and testing.

## Services

- **PostgreSQL** - Database server
- **LocalStack** - Local AWS services (S3, KMS, etc.)
- **OpenBao** - Key management service (HashiCorp Vault fork)
- **NATS** - Message broker with JetStream
- **Kafka** - Event streaming platform
- **Kafka UI** - Web UI for Kafka management

## Quick Start

1. Copy the environment example file from the project root:
   ```bash
   cp ../env.example ../.env
   ```

2. (Optional) Edit `.env` to customize settings and enable/disable services

3. Start enabled services:
   ```bash
   ./scripts/setup-all.sh
   ```

   Or manually with specific profiles:
   ```bash
   docker-compose --profile postgres --profile openbao up -d
   ```

## Enabling/Disabling Services

Services can be enabled or disabled using boolean environment variables in your `.env` file.

### Infrastructure Service Flags

Add these to your `.env` file to control which services start:

```bash
# Enable/disable infrastructure services
ENABLE_POSTGRES=true
ENABLE_LOCALSTACK=true
ENABLE_OPENBAO_SERVICE=true
ENABLE_NATS=false
ENABLE_KAFKA=false
```

**Boolean format:** Supports `true`, `1`, `yes`, `on` (case insensitive) for enabled, and `false`, `0`, `no`, `off` for disabled.

### Service Profiles

Each service uses a Docker Compose profile that corresponds to its enable flag:

| Flag | Profile | Service(s) |
|------|---------|------------|
| `ENABLE_POSTGRES` | `postgres` | PostgreSQL |
| `ENABLE_LOCALSTACK` | `localstack` | LocalStack |
| `ENABLE_OPENBAO_SERVICE` | `openbao` | OpenBao |
| `ENABLE_NATS` | `nats` | NATS |
| `ENABLE_KAFKA` | `kafka` | Kafka (KRaft mode), Kafka UI |

### Examples

**Start only PostgreSQL and OpenBao:**
```bash
# In .env
ENABLE_POSTGRES=true
ENABLE_OPENBAO_SERVICE=true
ENABLE_LOCALSTACK=false
ENABLE_NATS=false
ENABLE_KAFKA=false

# Then run
./scripts/setup-all.sh
```

**Start all services:**
```bash
# In .env
ENABLE_POSTGRES=true
ENABLE_LOCALSTACK=true
ENABLE_OPENBAO_SERVICE=true
ENABLE_NATS=true
ENABLE_KAFKA=true
```

**Manual profile selection:**
```bash
cd infra
docker-compose --profile postgres --profile openbao up -d
```

## Individual Service Setup

### OpenBao (Key Management)

OpenBao is initialized automatically when services start. To manually initialize:

```bash
./openbao-init/init.sh
```

This will:
- Enable the KV secrets engine
- Create application policies
- Generate an application token

### LocalStack (S3)

To set up S3 buckets:

```bash
./scripts/setup-localstack.sh
```

### NATS

NATS starts automatically with JetStream enabled. Check status:

```bash
curl http://localhost:8225/jsz | jq
```

### Kafka

Kafka auto-creates topics. To view existing topics:

```bash
kafka-topics --bootstrap-server localhost:9092 --list
```

Or use Kafka UI at http://localhost:8081

## Service Endpoints

| Service | Endpoint | Description |
|---------|----------|-------------|
| PostgreSQL | `localhost:5432` | Database connection |
| OpenBao | `http://localhost:8200` | Key management API |
| LocalStack | `http://localhost:4566` | AWS services gateway |
| NATS | `nats://localhost:4225` | Message broker |
| NATS Monitoring | `http://localhost:8225` | HTTP monitoring |
| Kafka | `localhost:9092` | Kafka broker (KRaft mode) |
| Kafka UI | `http://localhost:8081` | Web UI |

## Configuration

All services are configured via environment variables. See `../env.example` for all available options.

### Service Enable Flags

Control which services start:
- `ENABLE_POSTGRES` - Enable PostgreSQL (default: true)
- `ENABLE_LOCALSTACK` - Enable LocalStack (default: true)
- `ENABLE_OPENBAO_SERVICE` - Enable OpenBao (default: true)
- `ENABLE_NATS` - Enable NATS (default: false)
- `ENABLE_KAFKA` - Enable Kafka (default: false)

### Service Configuration Variables

- `VAULT_TOKEN` - OpenBao authentication token
- `AWS_S3_ENDPOINT` - LocalStack endpoint (default: http://localhost:4566)
- `AWS_S3_BUCKET` - S3 bucket name
- `NATS_URL` - NATS connection string
- `KAFKA_BOOTSTRAP_SERVERS` - Kafka broker addresses

## Management

### Start services

Using the setup script (recommended - respects enable flags):
```bash
./scripts/setup-all.sh
```

Using docker-compose directly with profiles:
```bash
cd infra
docker-compose --profile postgres --profile openbao up -d
```

### Stop services

Using the same profiles used to start:
```bash
cd infra
docker-compose --profile postgres --profile openbao down
```

Or stop all profiles:
```bash
cd infra
docker-compose down
```

### View logs

View logs for specific services:
```bash
cd infra
docker-compose logs -f [service-name]
```

View logs for specific profiles:
```bash
cd infra
docker-compose --profile postgres logs -f
```

### Stop and remove volumes (clean reset)

This removes all data volumes:
```bash
cd infra
docker-compose down -v
```

## Requirements

- Docker and Docker Compose
- AWS CLI (for LocalStack setup)
- Vault/OpenBao CLI (for OpenBao initialization)
- Kafka CLI tools (optional, for Kafka management)
- `jq` (optional, for JSON parsing in scripts)

## Notes

- All services run in development mode with default credentials
- Data persists in Docker volumes
- Services are configured to be accessible from the host machine
- For production, use proper authentication and security configurations

