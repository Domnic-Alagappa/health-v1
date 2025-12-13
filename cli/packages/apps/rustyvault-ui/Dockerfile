# Multi-stage build for RustyVault UI
# Build context should be ./cli directory (monorepo root)

# Dev stage (runs vite dev server) - OPTIMIZED: comes first to skip builder in dev mode
FROM ubuntu:24.04 AS runner-dev

# Install Bun and dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

# Only copy package files for dependency installation
COPY package.json bun.lock* ./
COPY packages/apps/rustyvault-ui/package.json ./packages/apps/rustyvault-ui/
COPY packages/libs/components/package.json ./packages/libs/components/
COPY packages/libs/shared/package.json ./packages/libs/shared/

# Install dependencies only (source code will be mounted as volume)
RUN bun install --frozen-lockfile || bun install

# Expose Vite dev server port
EXPOSE 3000

# Set working directory to rustyvault-ui app
WORKDIR /app/packages/apps/rustyvault-ui

# Start Vite dev server with memory limits
# Source code is mounted as volume in docker-compose.dev.yml
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]

# Dependencies stage (for production builds)
FROM ubuntu:24.04 AS deps

# Install Bun and dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# Set working directory to monorepo root
WORKDIR /app

# Copy root package.json and lockfile for workspace setup
COPY package.json bun.lock* ./

# Copy all workspace package.json files to install dependencies
COPY packages/apps/rustyvault-ui/package.json ./packages/apps/rustyvault-ui/
COPY packages/libs/components/package.json ./packages/libs/components/
COPY packages/libs/shared/package.json ./packages/libs/shared/

# Install all workspace dependencies
RUN bun install --frozen-lockfile || bun install

# Build stage (only for production)
FROM ubuntu:24.04 AS builder

# Install Bun and dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

# Copy node_modules from deps stage (includes all workspace dependencies)
COPY --from=deps /app/node_modules ./node_modules

# Copy root package files
COPY package.json bun.lock* ./
COPY biome.json* ./

# Copy all source files for libs and app
COPY packages/libs/shared ./packages/libs/shared
COPY packages/libs/components ./packages/libs/components
COPY packages/apps/rustyvault-ui ./packages/apps/rustyvault-ui

# Check if we're in dev mode (skip lib builds in dev, Vite handles them)
ARG BUILD_MODE=production
ENV BUILD_MODE=$BUILD_MODE

# Only build libs for production builds
# In dev mode, Vite can resolve workspace packages directly from source
RUN if [ "$BUILD_MODE" = "production" ]; then \
      echo "Building libs for production..."; \
      cd /app/packages/libs/shared && bun run build && \
      cd /app/packages/libs/components && bun run build; \
    else \
      echo "Dev mode: Skipping lib builds, Vite will use source files"; \
    fi

# Build rustyvault-ui app
WORKDIR /app/packages/apps/rustyvault-ui

# Build the application with environment variables
ARG VITE_API_BASE_URL=http://localhost:8200
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# In dev mode, just prepare (no build), in production, build
RUN if [ "$BUILD_MODE" = "production" ]; then \
      export NODE_ENV=production && bun run build; \
    else \
      echo "Dev mode: App will be built on container start"; \
    fi

# Production stage with Caddy (only for production builds)
FROM caddy:2-alpine AS runner-prod

# Copy built files
COPY --from=builder /app/packages/apps/rustyvault-ui/dist /usr/share/caddy

# Copy Caddyfile
COPY packages/apps/rustyvault-ui/Caddyfile /etc/caddy/Caddyfile

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]

