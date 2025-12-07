# Multi-stage build for Rust api-service
FROM rust:1.91-slim as builder

# Build arguments
ARG BUILD_MODE=release
ARG SKIP_CHECKS=false

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy workspace Cargo.toml
COPY backend/Cargo.toml backend/

# Copy Cargo configuration for low-memory builds
COPY backend/.cargo backend/.cargo

# Copy all crate Cargo.toml files
COPY backend/shared/Cargo.toml backend/shared/
COPY backend/authz-core/Cargo.toml backend/authz-core/
COPY backend/admin-service/Cargo.toml backend/admin-service/
COPY backend/api-service/Cargo.toml backend/api-service/

# Copy source code for all crates
COPY backend/shared/src backend/shared/src
COPY backend/authz-core/src backend/authz-core/src
COPY backend/admin-service/src backend/admin-service/src
COPY backend/api-service/src backend/api-service/src
COPY backend/migrations backend/migrations

# Build the application
# SQLx compile-time macros will validate queries against database at build time
# To enable offline builds, set SQLX_OFFLINE=true and ensure .sqlx directory exists
ENV RUST_BACKTRACE=1
ENV SQLX_OFFLINE=false

# Build based on mode and skip checks flag
# In dev mode, we skip building here - cargo run will build on first start
WORKDIR /app/backend
# Limit parallel jobs to reduce memory usage during compilation
ENV CARGO_BUILD_JOBS=${CARGO_BUILD_JOBS:-2}
ENV CARGO_NET_GIT_FETCH_WITH_CLI=true
RUN if [ "$BUILD_MODE" = "dev" ]; then \
        echo "Dev mode: Skipping build, will use cargo run directly"; \
    elif [ "$SKIP_CHECKS" = "true" ]; then \
        echo "Skipping type checks, building in release mode with limited parallelism..."; \
        RUSTFLAGS="-C link-arg=-s -A warnings" cargo build --release --bin api-service -j${CARGO_BUILD_JOBS}; \
        cp target/release/api-service /app/api-service; \
    else \
        echo "Running full build with checks and limited parallelism..."; \
        RUSTFLAGS="-C link-arg=-s" cargo build --release --bin api-service -j${CARGO_BUILD_JOBS}; \
        cp target/release/api-service /app/api-service; \
    fi

# Dev stage - runs cargo directly (when BUILD_MODE=dev)
FROM rust:1.91-slim AS runner-dev

# Install build and runtime dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app/backend

# Copy workspace Cargo.toml files (needed for cargo to work)
# Note: docker-compose.dev.yml mounts these as volumes for hot reload
# But we need them in the image as fallback if volumes aren't mounted
COPY backend/Cargo.toml ./
COPY backend/.cargo ./.cargo
COPY backend/shared/Cargo.toml ./shared/
COPY backend/authz-core/Cargo.toml ./authz-core/
COPY backend/admin-service/Cargo.toml ./admin-service/
COPY backend/api-service/Cargo.toml ./api-service/

# Copy migrations (always needed, even in dev mode)
COPY backend/migrations ./migrations

# Set environment variables for low-memory builds
ENV CARGO_BUILD_JOBS=${CARGO_BUILD_JOBS:-2}
ENV CARGO_NET_GIT_FETCH_WITH_CLI=true

# Expose port
EXPOSE 8080

# In dev mode, use cargo run - it will build on first start
# Source code is mounted as volume in docker-compose for hot reload
# Note: First run will compile everything
# For true hot reload, install cargo-watch: cargo install cargo-watch
# Then use: cargo watch -x 'run --bin api-service'
CMD ["cargo", "run", "--bin", "api-service"]

# Production runtime stage
FROM debian:bookworm-slim AS runner-prod

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -r -s /bin/false appuser

# Set working directory
WORKDIR /app

# Copy binary from builder (only exists in production build)
COPY --from=builder /app/api-service /app/api-service
COPY --from=builder /app/backend/migrations /app/migrations

# Set ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Run the application
CMD ["./api-service"]

# Test runner stage - for running tests in Docker
FROM rust:1.91-slim AS test-runner

# Install build and runtime dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    libpq-dev \
    ca-certificates \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app/backend

# Copy workspace Cargo.toml files
COPY backend/Cargo.toml ./
COPY backend/.cargo ./.cargo
COPY backend/shared/Cargo.toml ./shared/
COPY backend/authz-core/Cargo.toml ./authz-core/
COPY backend/admin-service/Cargo.toml ./admin-service/
COPY backend/api-service/Cargo.toml ./api-service/

# Copy migrations
COPY backend/migrations ./migrations

# Copy .sqlx directory for offline mode (if it exists)
# The .sqlx directory contains pre-generated query metadata for SQLX_OFFLINE mode
# If it doesn't exist in the build context, it will be available via volume mount
COPY backend/.sqlx ./.sqlx

# Copy source code
COPY backend/shared/src ./shared/src
COPY backend/authz-core/src ./authz-core/src
COPY backend/admin-service/src ./admin-service/src
COPY backend/api-service/src ./api-service/src
COPY backend/api-service/tests ./api-service/tests

# Set environment variables
ENV CARGO_BUILD_JOBS=${CARGO_BUILD_JOBS:-2}
ENV CARGO_NET_GIT_FETCH_WITH_CLI=true
ENV RUST_BACKTRACE=1
ENV SQLX_OFFLINE=true

# Default command runs tests
# Can be overridden in docker-compose
CMD ["cargo", "test", "--package", "api-service", "--", "--ignored"]

