# Docker Quick Start

## Development Mode (Skip Type Checks, Fast Build)

```bash
# Run in dev mode with checks skipped (faster builds)
SKIP_CHECKS=true BUILD_MODE=dev docker-compose up --build

# Or use the dev override file
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## Production Mode (Full Checks)

```bash
# Run with full type checking (default)
docker-compose up --build
```

## Run Only Infrastructure Services

If you're running services locally and just need Docker for databases/services:

```bash
# Start only postgres and openbao (skip API/UI builds)
docker-compose up postgres openbao
```

## Run Everything Locally

```bash
# Start only infrastructure
docker-compose up -d postgres openbao

# Run API service locally
cd backend
cargo run --bin api-service

# Run Admin UI locally (in another terminal)
cd cli/packages/apps/admin
npm run dev

# Run Client App locally (in another terminal)
cd cli/packages/apps/client-app
npm run dev
```

## Environment Variables for Build

- `BUILD_MODE`: `dev` or `release` (default: `release`)
- `SKIP_CHECKS`: `true` or `false` (default: `false`)
  - When `true`, suppresses warnings and skips some checks for faster builds

## Environment Variables for Runtime

### OpenBao/Vault Configuration

- `VAULT_ADDR`: OpenBao/Vault address (default: `http://openbao:8200` in Docker, `http://localhost:8200` locally)
- `VAULT_TOKEN`: Authentication token (default: `dev-root-token` for dev)
- `VAULT_MOUNT_PATH`: Secrets mount path (default: `secret`)
- `VAULT_NAMESPACE`: Namespace for enterprise setups (leave empty for dev mode)
- `ENABLE_HASHICORP_OPENBAO`: Enable OpenBao provider (default: `true`)

### Master Key Configuration

- `MASTER_KEY_PATH`: File path to store master key (fallback if vault unavailable)
- `MASTER_KEY`: Hex-encoded master key (fallback if vault unavailable)
- Master key is automatically stored in OpenBao/Vault when available

### Database Configuration

- `DATABASE_URL`: PostgreSQL connection string
- `POSTGRES_USER`: Database user (default: `auth_user`)
- `POSTGRES_PASSWORD`: Database password (default: `auth_password`)
- `POSTGRES_DB`: Database name (default: `auth_db`)

