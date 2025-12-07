# API Service

Backend API service for the Health V1 application.

## Testing

### Running Tests

```bash
# Run all tests
cargo test

# Run specific test file
cargo test --test auth_handlers_test

# Run tests with output
cargo test -- --nocapture

# Run ignored tests (requires DATABASE_URL)
cargo test -- --ignored

# Run E2E flow tests
cargo test --test e2e_flow_test -- --ignored
```

### Test Organization

Tests are located in the `tests/` directory:

- `auth_handlers_test.rs` - Authentication handler tests (login, logout, refresh_token, userinfo)
- `setup_handlers_test.rs` - Setup handler tests (check_setup_status, initialize_setup)
- `service_handlers_test.rs` - Service status handler tests (get_service_status)
- `e2e_flow_test.rs` - End-to-end flow tests (complete setup→login journey)
- `test_helpers.rs` - Shared test utilities and infrastructure

### End-to-End Flow Tests

The `e2e_flow_test.rs` file contains tests that verify the complete user journey:

- `test_e2e_setup_then_login` - Complete flow: setup → create admin → login
- `test_e2e_setup_status_before_setup` - Check status before setup
- `test_e2e_setup_status_after_setup` - Check status after setup
- `test_e2e_login_after_setup` - Login immediately after setup
- `test_e2e_setup_prevents_duplicate` - Cannot setup twice
- `test_e2e_login_with_setup_admin` - Login with admin created during setup

### Test Database Setup

**📖 For detailed setup instructions, see [TEST_SETUP.md](./TEST_SETUP.md)**

**Quick Start:**

**Option 1: Testcontainers (Easiest - Local Development)**
```bash
# Make sure Docker is running
docker ps

# Run tests (containers start automatically)
cd backend
cargo test --package api-service -- --ignored
```

**Option 2: Docker Compose (Isolated Environment)**
```bash
# From project root - no Rust installation needed
./backend/scripts/docker-test.sh
```

**Option 3: DATABASE_URL (Recommended for CI)**
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
cd backend
cargo test --package api-service -- --ignored
```

The test helpers automatically:
- Create database connections
- Run migrations
- Set up test AppState with all required services
- Manage container lifecycle (when using testcontainers)

## Code Coverage

### Using cargo-llvm-cov

```bash
# Install coverage tool
cargo install cargo-llvm-cov --locked

# Run tests with coverage
cargo llvm-cov --all-features --workspace

# Generate LCOV report (for CI/SonarQube)
cargo llvm-cov --all-features --workspace --lcov --output-path coverage/lcov.info

# Generate HTML report (for local viewing)
cargo llvm-cov --all-features --workspace --html --output-dir coverage/html

# Or use the coverage script
./scripts/coverage.sh
```

### Coverage Goals

- Target: 80%+ coverage for handlers
- Focus on critical paths: authentication, setup, service health
- Exclude: generated code, main.rs, bin files

### Viewing Coverage Reports

After generating HTML coverage:

```bash
# Open in browser
open coverage/html/index.html  # macOS
xdg-open coverage/html/index.html  # Linux
```

## Development

### Project Structure

```
api-service/
├── src/
│   ├── main.rs                 # Application entry point
│   ├── lib.rs                  # Library root
│   ├── bin/                    # Binary executables
│   └── presentation/
│       └── api/
│           ├── handlers/       # HTTP handlers
│           └── middleware/     # Request middleware
└── tests/                      # Integration tests
```

### Key Components

- **Handlers**: HTTP request handlers for API endpoints
- **Middleware**: Request processing middleware (auth, ACL, session, etc.)
- **AppState**: Shared application state with services and repositories

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `SERVER_HOST` - Server host (default: 0.0.0.0)
- `SERVER_PORT` - Server port (default: 8080)

For testing:
- `DATABASE_URL` - Test database connection string

