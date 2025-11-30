# Multi-stage build for React Admin App
# Build context should be ./cli directory
FROM oven/bun:1.1.0-alpine AS deps

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json bun.lock* ./

# Copy workspace package files
COPY packages/apps/admin/package.json ./packages/apps/admin/
COPY packages/libs/components/package.json ./packages/libs/components/
COPY packages/libs/shared/package.json ./packages/libs/shared/

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Build stage
FROM oven/bun:1.1.0-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/.bun ./bun

# Copy all source files
COPY package.json bun.lock* ./
COPY biome.json* ./
COPY packages/apps/admin ./packages/apps/admin
COPY packages/libs/components ./packages/libs/components
COPY packages/libs/shared ./packages/libs/shared

# Set working directory to admin app
WORKDIR /app/packages/apps/admin

# Build the application with environment variables
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV NODE_ENV=production

RUN bun run build

# Production stage with Caddy
FROM caddy:2-alpine AS runner

# Copy built files
COPY --from=builder /app/packages/apps/admin/dist /usr/share/caddy

# Copy Caddyfile
COPY packages/apps/admin/Caddyfile /etc/caddy/Caddyfile

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]

