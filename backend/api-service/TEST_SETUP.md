# Test Setup Guide

This guide explains how to set up and run the test suite for the API service.

## Quick Start

### Option 1: Using Testcontainers (Easiest - Recommended for Local Development)

**Prerequisites:**
- Docker Desktop installed and running
- Rust toolchain installed

**Steps:**

1. **Verify Docker is running:**
   ```bash
   docker ps
   ```
   If this command works, Docker is running. If not, start Docker Desktop.

2. **Run tests:**
   ```bash
   cd backend
   cargo test --package api-service -- --ignored
   ```

That's it! Testcontainers will automatically:
- Start a PostgreSQL container
- Run migrations
- Execute all tests
- Clean up the container when done

### Option 2: Using Docker Compose (Isolated Test Environment)

**Prerequisites:**
- Docker Desktop installed and running
- No need for local Rust installation

**Steps:**

1. **Run tests using Docker Compose:**
   ```bash
   # From project root
   ./backend/scripts/docker-test.sh
   ```
   
   Or manually:
   ```bash
   docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit
   ```

**What happens:**
- Spins up a separate PostgreSQL container (`postgres-test`) in isolated Docker network
- Builds a test runner container with all dependencies
- Automatically runs migrations
- Executes all tests
- Cleans up containers when done

**Note:** The test database runs on an internal Docker network and doesn't expose ports by default. If you need to access it from the host, uncomment the `ports` section in `docker-compose.test.yml`.

**Benefits:**
- Completely isolated test environment
- No need to install Rust locally
- Consistent test environment across machines
- Automatic cleanup

**Clean up manually (if needed):**
```bash
docker-compose -f docker-compose.test.yml down -v
```

### Option 3: Using Existing PostgreSQL Database (Recommended for CI)

**Prerequisites:**
- PostgreSQL server running (local or remote)
- Database credentials

**Steps:**

1. **Set DATABASE_URL environment variable:**
   ```bash
   export DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
   ```
   
   Or for a remote database:
   ```bash
   export DATABASE_URL="postgresql://user:password@hostname:5432/test_db"
   ```

2. **Create the test database (if it doesn't exist):**
   ```bash
   # Connect to PostgreSQL
   psql -U user -d postgres
   
   # Create test database
   CREATE DATABASE test_db;
   \q
   ```

3. **Run tests:**
   ```bash
   cd backend
   cargo test --package api-service -- --ignored
   ```

The test helpers will automatically:
- Connect to your database
- Run migrations
- Execute all tests

## Docker Compose Test Configuration

The `docker-compose.test.yml` file provides a complete isolated test environment:

**Services:**
- `postgres-test`: PostgreSQL database for tests (port 5433)
- `api-service-test`: Test runner container that executes all tests

**Features:**
- Separate network (`health-test-network`) to avoid conflicts
- Automatic database health checks
- Automatic migration execution
- Clean shutdown and volume cleanup

**Customization:**

You can customize the test environment by setting environment variables:

```bash
# Custom database credentials
POSTGRES_USER=myuser POSTGRES_PASSWORD=mypass \
docker-compose -f docker-compose.test.yml up
```

**View logs:**
```bash
docker-compose -f docker-compose.test.yml logs -f api-service-test
```

**Run specific test file:**
Modify the `command` in `docker-compose.test.yml` or override it:
```bash
docker-compose -f docker-compose.test.yml run --rm api-service-test \
  cargo test --package api-service --test setup_handlers_test -- --ignored
```

## Running Specific Test Files

Run only specific test files:

```bash
# Setup handler tests only
cargo test --package api-service --test setup_handlers_test -- --ignored

# Auth handler tests only
cargo test --package api-service --test auth_handlers_test -- --ignored

# E2E flow tests only
cargo test --package api-service --test e2e_flow_test -- --ignored

# Service handler tests only
cargo test --package api-service --test service_handlers_test -- --ignored
```

## Running Specific Tests

Run a single test by name:

```bash
cargo test --package api-service --test auth_handlers_test test_login_success -- --ignored
```

## Test Coverage

Generate coverage reports:

```bash
cd backend
./scripts/coverage.sh
```

This will:
- Install `cargo-llvm-cov` if needed
- Run all tests with coverage
- Generate LCOV report: `coverage/lcov.info`
- Generate HTML report: `coverage/html/index.html`

View the HTML report:
```bash
open coverage/html/index.html  # macOS
# or
xdg-open coverage/html/index.html  # Linux
```

## Troubleshooting

### Error: "Failed to start PostgreSQL container. Make sure Docker is running."

**Solution:** Start Docker Desktop and verify it's running:
```bash
docker ps
```

### Error: "error communicating with database"

**Solution:** 
- If using testcontainers: Wait a few seconds for the container to fully start
- If using DATABASE_URL: Verify the connection string is correct and the database is accessible

### Error: "migration failed"

**Solution:** The migrations directory might not be found. Ensure you're running tests from the `backend` directory:
```bash
cd backend
cargo test --package api-service -- --ignored
```

### Tests are slow

**Solution:** 
- Use `DATABASE_URL` with a persistent database (faster than starting containers)
- Run specific test files instead of all tests
- Use `cargo test --release` for optimized builds (though this may hide some bugs)

### Container cleanup issues

**Solution:** If containers aren't being cleaned up:
```bash
# List testcontainers containers
docker ps -a | grep testcontainers

# Remove old testcontainers containers
docker rm -f $(docker ps -a | grep testcontainers | awk '{print $1}')
```

### Docker Compose test issues

**Error: "Cannot connect to Docker daemon"**

**Solution:** Start Docker Desktop and verify:
```bash
docker ps
```

**Error: "Port already in use"**

**Solution:** The test database doesn't expose ports by default (uses internal Docker network). If you've enabled port mapping and get this error:
```bash
# Option 1: Use a different port
POSTGRES_TEST_PORT=5435 docker-compose -f docker-compose.test.yml up

# Option 2: Remove port mapping (recommended - tests don't need external access)
# Edit docker-compose.test.yml and comment out the ports section
```

**Error: "Build failed"**

**Solution:** 
- Ensure Docker has enough resources (memory/CPU)
- Try rebuilding: `docker-compose -f docker-compose.test.yml build --no-cache`
- Check Docker logs: `docker-compose -f docker-compose.test.yml logs`

**Tests hang or timeout**

**Solution:**
- Check database health: `docker-compose -f docker-compose.test.yml ps`
- View logs: `docker-compose -f docker-compose.test.yml logs -f api-service-test`
- Increase timeout in docker-compose.test.yml if needed

## CI/CD Setup

For CI environments, use `DATABASE_URL` with a PostgreSQL service:

**GitHub Actions Example:**
```yaml
services:
  postgres:
    image: postgres:15
    env:
      POSTGRES_USER: auth_user
      POSTGRES_PASSWORD: auth_password
      POSTGRES_DB: auth_db_test
    ports:
      - 5432:5432

env:
  DATABASE_URL: postgresql://auth_user:auth_password@localhost:5432/auth_db_test
```

See `.github/workflows/test-coverage.yml` for a complete example.

## Test Organization

Tests are organized in the following files:

- `tests/test_helpers.rs` - Shared test utilities and database setup
- `tests/setup_handlers_test.rs` - Setup endpoint tests
- `tests/auth_handlers_test.rs` - Authentication endpoint tests
- `tests/service_handlers_test.rs` - Service status tests
- `tests/e2e_flow_test.rs` - End-to-end integration tests

All tests are marked with `#[ignore]` to prevent accidental execution without proper database setup.

## Summary of Test Methods

| Method | Best For | Prerequisites | Command |
|--------|----------|---------------|---------|
| **Testcontainers** | Local development | Docker + Rust | `cargo test --package api-service -- --ignored` |
| **Docker Compose** | Isolated environments | Docker only | `./backend/scripts/docker-test.sh` |
| **DATABASE_URL** | CI/CD pipelines | PostgreSQL + Rust | `export DATABASE_URL=... && cargo test ...` |

## Next Steps

After setting up tests:

1. **Choose a test method** from the options above
2. **Run all tests:**
   - Testcontainers: `cargo test --package api-service -- --ignored`
   - Docker Compose: `./backend/scripts/docker-test.sh`
   - DATABASE_URL: `export DATABASE_URL=... && cargo test --package api-service -- --ignored`
3. **Check coverage:** `./backend/scripts/coverage.sh`
4. **Review test output** for any failures
5. **Add new tests** as you develop new features

