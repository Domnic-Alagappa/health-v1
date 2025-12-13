# Versioning Strategy

This document describes the versioning strategy for the health-v1 project, including API versioning and crate versioning.

## API Versioning

### Strategy

All API endpoints use URL-based versioning with the `/v1/` prefix. This allows for future API versions (e.g., `/v2/`) while maintaining backward compatibility.

### Current Implementation

- **api-service**: All routes use `/v1/` prefix (e.g., `/v1/auth/login`, `/v1/users`, `/v1/admin/permissions/check`)
- **rustyvault-service**: Already uses `/v1/` prefix for all routes (e.g., `/v1/sys/health`, `/v1/secret/{*path}`)

### Versioning Policy

All API endpoints **must** use the `/v1/` prefix. There are no unversioned routes (except `/health`).

- **Versioned routes**: `/v1/auth/login`, `/v1/users`, `/v1/admin/permissions/check`
- **Unversioned routes**: None (removed for clean API design)
- **Exception**: `/health` endpoint remains unversioned for load balancer compatibility

### Version Negotiation

The API supports two methods of version negotiation:

1. **URL-based** (primary): `/v1/`, `/v2/`, etc.
2. **Header-based** (optional): `Accept: application/vnd.api+json;version=1`

The API version middleware (`shared::infrastructure::api::version`) automatically:
- Extracts version from URL path
- Falls back to Accept header if URL is unversioned (defaults to v1)
- Adds `X-API-Version` header to all responses

### Health Check Endpoint

The `/health` endpoint remains unversioned as it's used by load balancers and monitoring systems.

### Development Policy

Since this is a development project, we start with versioning from the beginning:
- **No backward compatibility routes** - all endpoints use `/v1/` prefix
- **Clean API design** - consistent versioning from day one
- **Future-ready** - easy to add `/v2/` when needed

## Crate Versioning

### Strategy

Each crate in the workspace has its own version number using semantic versioning (MAJOR.MINOR.PATCH).

### Current Versions

All crates start at version `0.1.0`:

- `shared`: `0.1.0` - Foundation library, stable
- `authz-core`: `0.1.0` - Authorization core, depends on shared
- `admin-service`: `0.1.0` - Admin service library
- `api-service`: `0.1.0` - Main API service binary
- `rustyvault-service`: `0.1.0` - Vault service binary

### Semantic Versioning Rules

- **MAJOR** (x.0.0): Breaking changes to public API
- **MINOR** (0.x.0): New features, backward compatible
- **PATCH** (0.0.x): Bug fixes, backward compatible

### Version Updates

When updating a crate version:

1. Update the version in `Cargo.toml`
2. Update dependent crates if there are breaking changes
3. Document breaking changes in crate's CHANGELOG (if exists)
4. Update this document with the new version

### Dependency Management

Crates can depend on specific versions of other workspace crates:

```toml
[dependencies]
shared = { path = "../shared" }  # Uses workspace version
# Or pin to specific version:
# shared = { path = "../shared", version = "0.1.0" }
```

### Version in Health Checks

Health check endpoints should include version information:

```json
{
  "status": "ok",
  "service": "api-service",
  "version": "0.1.0"
}
```

## Frontend Route Constants

Frontend route constants in `cli/packages/libs/shared/src/api/routes.ts` use the `/v1/` prefix:

```typescript
export const API_ROUTES = {
  AUTH: {
    LOGIN: "/v1/auth/login",
    // ...
  },
  // ...
}
```

The frontend's `getApiUrl()` function automatically adds the `/api` prefix where needed, but respects the `/v1/` version prefix.

## Breaking Changes

### API Breaking Changes

When making breaking changes to the API:

1. Create a new version (e.g., `/v2/`)
2. Keep old version available for deprecation period
3. Document migration guide
4. Update frontend route constants
5. Remove old version after deprecation period

### Crate Breaking Changes

When making breaking changes to a crate:

1. Increment MAJOR version
2. Update all dependent crates
3. Document breaking changes
4. Update this document

## Examples

### Adding a New API Version

```rust
// Add v2 routes alongside v1
let v2_routes = Router::new()
    .route("/v2/users", get(get_users_v2))
    // ...

let app = Router::new()
    .merge(v1_routes)
    .merge(v2_routes);
```

### Updating Crate Version

```toml
# Cargo.toml
[package]
name = "shared"
version = "0.2.0"  # Minor version bump for new features
```

## References

- [Semantic Versioning](https://semver.org/)
- [REST API Versioning Best Practices](https://restfulapi.net/versioning/)
