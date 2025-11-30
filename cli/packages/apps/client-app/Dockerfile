# Multi-stage build for React Client App
# Build context should be ./cli directory
FROM node:22-alpine AS deps

# Install build dependencies, bash, and Bun
RUN apk add --no-cache curl unzip python3 make g++ bash && \
    curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun && \
    chmod +x /usr/local/bin/bun && \
    rm -rf /root/.bun

# Set working directory
WORKDIR /app

# Copy root package files
COPY package.json bun.lock* ./

# Copy workspace package files
COPY packages/apps/client-app/package.json ./packages/apps/client-app/
COPY packages/libs/components/package.json ./packages/libs/components/
COPY packages/libs/shared/package.json ./packages/libs/shared/

# Install dependencies
RUN bun install --frozen-lockfile || bun install

# Build stage
FROM node:22-alpine AS builder

# Install build dependencies, bash, and Bun
RUN apk add --no-cache curl unzip python3 make g++ bash && \
    curl -fsSL https://bun.sh/install | bash && \
    mv /root/.bun/bin/bun /usr/local/bin/bun && \
    chmod +x /usr/local/bin/bun && \
    rm -rf /root/.bun

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY package.json bun.lock* ./
COPY biome.json* ./
COPY packages/apps/client-app ./packages/apps/client-app
COPY packages/libs/components ./packages/libs/components
COPY packages/libs/shared ./packages/libs/shared

# Set working directory to client app
WORKDIR /app/packages/apps/client-app

# Build the application with environment variables
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV NODE_ENV=production

# Build without TypeScript type checking (skip tsc)
RUN bun run vite build

# Production stage with Caddy
FROM caddy:2-alpine AS runner

# Copy built files
COPY --from=builder /app/packages/apps/client-app/dist /usr/share/caddy

# Copy Caddyfile
COPY packages/apps/client-app/Caddyfile /etc/caddy/Caddyfile

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Start Caddy
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]

