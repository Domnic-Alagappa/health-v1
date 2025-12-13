# RustyVault UI Setup Guide

## Overview
RustyVault UI is a professional web interface for managing RustyVault secrets, realms, policies, and system operations.

## Quick Start

### Using Docker Compose (Recommended)

**Production Mode:**
```bash
docker-compose up rustyvault-ui
```

**Development Mode:**
```bash
docker-compose -f docker-compose.dev.yml up rustyvault-ui
```

The UI will be available at:
- Production: `http://localhost:5176`
- Development: `http://localhost:3000`

### Local Development

1. **Install Dependencies:**
```bash
cd cli
bun install
```

2. **Set Environment Variables:**
Create `cli/packages/apps/rustyvault-ui/.env`:
```env
VITE_API_BASE_URL=http://localhost:8201
VITE_PORT=3000
VITE_HOST=localhost
```

3. **Start Development Server:**
```bash
cd cli/packages/apps/rustyvault-ui
bun run dev
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | RustyVault API base URL | `http://localhost:8201` |
| `VITE_PORT` | Dev server port | `3000` |
| `VITE_HOST` | Dev server host | `localhost` |

### Docker Configuration

In Docker, the UI connects to RustyVault service using the internal Docker network:
- **Production**: `http://rustyvault-service:8200`
- **Development**: `http://rustyvault-service:8201`

For local development outside Docker, use:
- `http://localhost:8201` (if RustyVault is running locally)

## Features

- **Secrets Management**: Create, read, update, and delete secrets
- **Realms Management**: Manage vault realms and namespaces
- **Policies Management**: Configure access policies
- **Token Management**: View and manage authentication tokens
- **System Operations**: Monitor vault health and system status
- **User Management**: Manage vault users

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/          # Authentication components
│   └── navigation/     # Navigation components
├── lib/
│   └── api/           # API client modules
│       ├── client.ts  # Axios-based API client
│       ├── auth.ts    # Authentication API
│       ├── secrets.ts # Secrets API
│       ├── realms.ts  # Realms API
│       ├── policies.ts # Policies API
│       ├── tokens.ts  # Tokens API
│       ├── users.ts   # Users API
│       └── system.ts  # System API
├── routes/            # TanStack Router routes
│   ├── __root.tsx    # Root layout with auth
│   ├── index.tsx     # Dashboard
│   ├── login.tsx     # Login page
│   ├── secrets.tsx   # Secrets management
│   ├── realms.tsx    # Realms management
│   ├── policies.tsx  # Policies management
│   ├── tokens.tsx    # Token management
│   ├── users.tsx     # User management
│   └── system.tsx    # System operations
└── stores/
    └── authStore.ts  # Zustand authentication store
```

## Technology Stack

- **React 19** - UI framework
- **TanStack Router** - Type-safe routing
- **TanStack React Query** - Data fetching and caching
- **Zustand** - State management
- **@health-v1/ui-components** - Shared component library
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Biome.js** - Linting and formatting

## Troubleshooting

### UI can't connect to RustyVault

1. **Check RustyVault is running:**
```bash
docker ps | grep rustyvault-service
```

2. **Verify the API URL:**
   - In Docker: Should be `http://rustyvault-service:8200` (or `:8201` in dev)
   - Locally: Should be `http://localhost:8201`

3. **Check network connectivity:**
```bash
# From UI container
docker exec health-rustyvault-ui curl http://rustyvault-service:8200/v1/sys/health
```

### Port conflicts

If port 5176 (production) or 3000 (dev) is already in use:
- Change `VAULT_UI_PORT` in `.env` file
- Or stop the conflicting service

## Building for Production

```bash
cd cli/packages/apps/rustyvault-ui
bun run build
```

The built files will be in `dist/` directory, ready to be served by Caddy (as configured in Dockerfile).

## Health Check

The UI includes a health check endpoint at `/health` that returns `200 OK` when the service is running.

