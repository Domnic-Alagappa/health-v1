# Multi-stage build for Rust api-service
FROM rust:1.91-slim as builder

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
# Since we're using runtime SQLx queries (not compile-time macros), 
# no database connection is needed during build
ENV RUST_BACKTRACE=1

# Build the release binary
WORKDIR /app/backend
RUN cargo build --release --bin api-service

# Copy the binary to a known location
RUN cp target/release/api-service /app/api-service

# Runtime stage
FROM debian:bookworm-slim

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

# Copy binary from builder
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

