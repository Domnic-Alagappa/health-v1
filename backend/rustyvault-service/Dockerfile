# Multi-stage build for Rust rustyvault-service
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

# Copy all crate Cargo.toml files first (required before Cargo reads workspace)
# All workspace members must be present for Cargo to validate the workspace
COPY backend/shared/Cargo.toml backend/shared/
COPY backend/authz-core/Cargo.toml backend/authz-core/
COPY backend/admin-service/Cargo.toml backend/admin-service/
COPY backend/api-service/Cargo.toml backend/api-service/
COPY backend/rustyvault-service/Cargo.toml backend/rustyvault-service/

# Copy source code for all workspace members (Cargo needs them to validate)
COPY backend/shared/src backend/shared/src
COPY backend/authz-core/src backend/authz-core/src
COPY backend/admin-service/src backend/admin-service/src
COPY backend/api-service/src backend/api-service/src
COPY backend/rustyvault-service/src backend/rustyvault-service/src
COPY backend/migrations backend/migrations

# Build the application
ENV RUST_BACKTRACE=1
ENV SQLX_OFFLINE=false

# Build based on mode and skip checks flag
WORKDIR /app/backend
ENV CARGO_BUILD_JOBS=${CARGO_BUILD_JOBS:-2}
ENV CARGO_NET_GIT_FETCH_WITH_CLI=true
RUN if [ "$BUILD_MODE" = "dev" ]; then \
        echo "Dev mode: Skipping build, will use cargo run directly"; \
    elif [ "$SKIP_CHECKS" = "true" ]; then \
        echo "Skipping type checks, building in release mode with limited parallelism..."; \
        RUSTFLAGS="-C link-arg=-s -A warnings" cargo build --release --bin rustyvault-service -j${CARGO_BUILD_JOBS}; \
        cp target/release/rustyvault-service /app/rustyvault-service; \
    else \
        echo "Running full build with checks and limited parallelism..."; \
        RUSTFLAGS="-C link-arg=-s" cargo build --release --bin rustyvault-service -j${CARGO_BUILD_JOBS}; \
        cp target/release/rustyvault-service /app/rustyvault-service; \
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

# Copy workspace Cargo.toml files
COPY backend/Cargo.toml ./
COPY backend/.cargo ./.cargo
COPY backend/shared/Cargo.toml ./shared/
COPY backend/authz-core/Cargo.toml ./authz-core/
COPY backend/admin-service/Cargo.toml ./admin-service/
COPY backend/api-service/Cargo.toml ./api-service/
COPY backend/rustyvault-service/Cargo.toml ./rustyvault-service/

# Copy source code for all workspace members (Cargo needs them)
COPY backend/shared/src ./shared/src
COPY backend/authz-core/src ./authz-core/src
COPY backend/admin-service/src ./admin-service/src
COPY backend/api-service/src ./api-service/src
COPY backend/rustyvault-service/src ./rustyvault-service/src

# Copy migrations
COPY backend/migrations ./migrations

# Set environment variables for low-memory builds
ENV CARGO_BUILD_JOBS=${CARGO_BUILD_JOBS:-2}
ENV CARGO_NET_GIT_FETCH_WITH_CLI=true

# Expose port
EXPOSE 8200

# In dev mode, use cargo run - it will build on first start
CMD ["cargo", "run", "--bin", "rustyvault-service"]

# Production stage
FROM debian:bookworm-slim AS runner-prod

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libssl3 \
    libpq5 \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create app user
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/data /app/vault-data && \
    chown -R appuser:appuser /app

# Copy binary from builder
COPY --from=builder /app/rustyvault-service /app/rustyvault-service

# Copy migrations
COPY backend/migrations /app/migrations

# Set working directory
WORKDIR /app

# Switch to app user
USER appuser

# Expose port
EXPOSE 8200

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8200/v1/sys/health || exit 1

# Run the service
CMD ["/app/rustyvault-service"]

