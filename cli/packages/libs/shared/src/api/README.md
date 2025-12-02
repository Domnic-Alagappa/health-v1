# API Configuration and Routes

## Automatic API Prefix

All API routes automatically get the `/api` prefix added by default. This means you can define routes without the prefix and it will be added automatically.

### Configuration

The API prefix is configured in `config.ts`:

```typescript
API_PREFIX: import.meta.env?.VITE_API_PREFIX || "/api"
```

You can override this by setting the `VITE_API_PREFIX` environment variable.

### How It Works

The `getApiUrl()` function automatically prepends the API prefix to all routes, except:

1. **Routes that already start with `/api`** - These won't get the prefix doubled
2. **Excluded paths** - These paths don't get the prefix:
   - `/health` - Health check endpoint
   - `/auth/*` - Authentication endpoints (login, logout, etc.)

### Example Usage

```typescript
// Route defined without /api prefix
API_ROUTES.SETUP.STATUS = "/setup/status"

// getApiUrl automatically adds /api prefix
getApiUrl("/setup/status")  // Returns: "http://localhost:8080/api/setup/status"

// Excluded paths don't get prefix
getApiUrl("/health")         // Returns: "http://localhost:8080/health"
getApiUrl("/auth/login")     // Returns: "http://localhost:8080/auth/login"

// Routes already starting with /api are left as-is
getApiUrl("/api/admin/users") // Returns: "http://localhost:8080/api/admin/users"
```

### Defining Routes

When defining routes, **don't include the `/api` prefix** - it will be added automatically:

```typescript
// ✅ Good - no /api prefix
export const API_ROUTES = {
  SETUP: {
    STATUS: "/setup/status",  // Automatically becomes /api/setup/status
    INITIALIZE: "/setup/initialize",
  },
  USERS: {
    LIST: "/users",  // Automatically becomes /api/users
  },
};

// ❌ Bad - includes /api prefix
export const API_ROUTES = {
  SETUP: {
    STATUS: "/api/setup/status",  // Will become /api/api/setup/status (doubled!)
  },
};
```

### Excluded Paths

The following paths are excluded from automatic prefix (they match backend routes exactly):

- `/health` - Health check
- `/auth/*` - All authentication endpoints:
  - `/auth/login`
  - `/auth/logout`
  - `/auth/token`
  - `/auth/userinfo`

If you need to exclude additional paths, update the `EXCLUDED_PATHS` array in `config.ts`.

### Environment Variables

You can configure the API prefix via environment variable:

```bash
# .env file
VITE_API_PREFIX=/api  # Default value
```

### Migration Guide

When migrating existing routes:

1. **Remove `/api` prefix** from route constants:
   ```typescript
   // Before
   STATUS: "/api/setup/status"
   
   // After
   STATUS: "/setup/status"
   ```

2. **Update hardcoded paths** to use route constants:
   ```typescript
   // Before
   apiClient.get("/api/setup/status")
   
   // After
   apiClient.get(API_ROUTES.SETUP.STATUS)
   ```

3. **Routes already using constants** will automatically work - no changes needed!

### Backend Compatibility

The backend routes are structured as:

- **Without `/api` prefix**: `/health`, `/auth/*`
- **With `/api` prefix**: `/api/setup/*`, `/api/services/*`, `/api/admin/*`, `/api/users/*`, etc.

The automatic prefix system handles this by:
- Adding `/api` to routes that need it
- Keeping `/health` and `/auth/*` without prefix (excluded paths)
- Not doubling prefixes for routes that already start with `/api`

