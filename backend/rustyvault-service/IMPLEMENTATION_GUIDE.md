# RustyVault Service Implementation Guide

## Architecture Decision: Separate Service vs Integrated

### ✅ **Recommendation: Keep as Separate Service**

**Reasons:**
1. **Security Isolation**: Vault operations are security-critical and benefit from isolation
2. **Independent Scaling**: Can scale vault service independently based on secret access patterns
3. **Deployment Flexibility**: Can deploy vault separately, update independently
4. **Clear Boundaries**: Vault has distinct API surface (Vault-compatible REST API)
5. **Resource Management**: Vault operations (encryption, barrier) are resource-intensive
6. **Compliance**: Easier to audit and certify a dedicated secret management service

**Current Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│                    health-v1 Monorepo                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ API Service  │  │ Admin UI     │  │ Client App   │  │
│  │ (Port 8080)  │  │ (Port 5174)  │  │ (Port 5175)  │  │
│  └──────┬───────┘  └──────────────┘  └──────────────┘  │
│         │                                                │
│         │  ┌──────────────────────────────────────┐    │
│         └──┤  Shared Infrastructure                │    │
│            │  - PostgreSQL (metadata)              │    │
│            │  - Shared libraries                  │    │
│            │  - Common config                     │    │
│            └──────────────────────────────────────┘    │
│                                                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │  RustyVault Service (Port 8200)                  │  │
│  │  - Vault Core (seal/unseal)                      │  │
│  │  - Security Barrier (AES-GCM)                    │  │
│  │  - Secrets Engines (KV, PKI, etc.)              │  │
│  │  - Auth Methods (UserPass, AppRole, etc.)        │  │
│  │  - Policy Engine (ACL)                           │  │
│  │  - Realm Management                              │  │
│  │                                                   │  │
│  │  Storage:                                        │  │
│  │  - Metadata → PostgreSQL (via shared)            │  │
│  │  - Secrets → Encrypted barrier (file/barrier)   │  │
│  └──────────────────────────────────────────────────┘  │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

**Integration Points:**
- **Database**: Shares PostgreSQL for metadata (realms, mounts, policies, auth methods)
- **Infrastructure**: Uses shared libraries (config, logging, database service)
- **Network**: Separate service, communicates via HTTP REST API
- **Storage**: Hybrid approach - metadata in DB, secrets in encrypted barrier

## Implementation Phases

### Phase 1: Fix Compilation Errors & Router Setup

**Problem**: Axum handlers with `State` extractor require router state to be set before route definition.

**Solution Options:**

#### Option A: Use Request Extensions (Recommended)
```rust
// In routes.rs
pub fn create_router(state: Arc<AppState>) -> Router {
    Router::new()
        .route("/v1/sys/init", post({
            let state = state.clone();
            move |payload: Json<Value>| {
                let state = state.clone();
                async move {
                    sys_handlers::init(state, payload).await
                }
            }
        }))
        .layer(middleware::from_fn(move |mut req: Request, next: Next| {
            let state = state.clone();
            async move {
                req.extensions_mut().insert(state);
                next.run(req).await
            }
        }))
}

// In handlers
pub async fn init(
    state: Arc<AppState>,  // Extract from extension or closure
    payload: Json<Value>,
) -> Result<Json<Value>, (StatusCode, Json<Value>)> {
    // Handler implementation
}
```

#### Option B: Separate Routers with State
```rust
pub fn create_router(state: Arc<AppState>) -> Router<Arc<AppState>> {
    let public = Router::new()
        .route("/v1/sys/health", get(health_check))
        .route("/v1/sys/init", post(init))
        .with_state(state.clone());
    
    let protected = Router::new()
        .route("/v1/sys/seal-status", get(seal_status))
        // ... other routes
        .layer(auth_middleware)
        .with_state(state.clone());
    
    Router::new().merge(public).merge(protected)
}
```

**Action Items:**
1. Choose Option A (simpler, more flexible)
2. Refactor handlers to accept `Arc<AppState>` directly
3. Update middleware to inject state into extensions
4. Test all endpoints

---

### Phase 2: Policy Module Implementation

**Priority**: HIGH (Required for security/authorization)

**Files to Create:**
```
src/modules/policy/
├── mod.rs              # Module exports
├── policy.rs           # Policy structures, parsing, evaluation
├── acl.rs              # ACL evaluation engine
├── policy_store.rs     # Policy storage (PostgreSQL)
└── capabilities.rs     # Capability definitions
```

**Implementation Steps:**

1. **Copy Core Structures from RustyVault**
   ```bash
   # Source files to reference:
   - RustyVault/src/modules/policy/policy.rs
   - RustyVault/src/modules/policy/acl.rs
   - RustyVault/src/modules/policy/policy_store.rs
   ```

2. **Adapt to health-v1 Infrastructure**
   - Replace RustyVault's storage with PostgreSQL via `MetadataStore`
   - Replace `RvError` with `VaultError`
   - Replace HCL parsing with simplified JSON/YAML (or keep HCL if needed)
   - Use health-v1's database service

3. **Database Schema**
   ```sql
   CREATE TABLE vault_policies (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       name VARCHAR(255) NOT NULL UNIQUE,
       policy_type VARCHAR(50) NOT NULL, -- 'acl', 'rgp', 'egp', 'token'
       raw_policy TEXT NOT NULL,
       parsed_policy JSONB,
       created_at TIMESTAMP DEFAULT NOW(),
       updated_at TIMESTAMP DEFAULT NOW()
   );
   
   CREATE INDEX idx_vault_policies_name ON vault_policies(name);
   CREATE INDEX idx_vault_policies_type ON vault_policies(policy_type);
   ```

4. **Core Components**
   - `Policy`: Policy structure with paths and capabilities
   - `ACL`: Access Control List evaluator
   - `PolicyStore`: CRUD operations for policies
   - `Capability`: Enum for operations (read, write, delete, list, sudo, etc.)

5. **API Endpoints**
   ```
   GET    /v1/sys/policies/acl          # List all ACL policies
   GET    /v1/sys/policies/acl/:name    # Read policy
   POST   /v1/sys/policies/acl/:name    # Create/update policy
   DELETE /v1/sys/policies/acl/:name    # Delete policy
   POST   /v1/sys/capabilities          # Check capabilities for path
   ```

**Testing:**
- Unit tests for policy parsing
- Unit tests for ACL evaluation
- Integration tests for policy CRUD
- Integration tests for capability checks

---

### Phase 3: Auth Module Implementation

**Priority**: HIGH (Required for authentication)

**Files to Create:**
```
src/modules/auth/
├── mod.rs              # Main auth module
├── userpass.rs         # Username/password auth
├── approle.rs          # AppRole auth
├── cert.rs             # Certificate auth
├── token.rs            # Token management
├── mfa/
│   ├── mod.rs
│   └── totp.rs         # TOTP MFA
├── oauth2.rs           # OAuth2 support
└── saml.rs             # SAML support
```

**Implementation Order:**

1. **Token Management (Foundation)**
   - Token generation, validation, expiration
   - Token storage in PostgreSQL
   - Token revocation

2. **UserPass Authentication**
   - User CRUD operations
   - Password hashing (bcrypt)
   - Login endpoint
   - Token issuance on successful login

3. **AppRole Authentication**
   - Role and Secret ID management
   - AppRole login flow
   - Secret ID rotation

4. **Certificate Authentication**
   - Certificate validation
   - Certificate-based login
   - Certificate CRL checking

5. **MFA (Multi-Factor Authentication)**
   - TOTP support
   - MFA enrollment
   - MFA verification

6. **OAuth2 & SAML** (Lower priority)
   - OAuth2 provider integration
   - SAML SSO support

**Database Schema:**
```sql
-- Users (for UserPass)
CREATE TABLE vault_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    policies TEXT[], -- Array of policy names
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tokens
CREATE TABLE vault_tokens (
    id UUID PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    policies TEXT[],
    ttl INTEGER, -- Time to live in seconds
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    last_used_at TIMESTAMP
);

-- AppRoles
CREATE TABLE vault_approles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR(255) NOT NULL UNIQUE,
    bind_secret_id BOOLEAN DEFAULT true,
    secret_id_ttl INTEGER,
    token_ttl INTEGER,
    token_max_ttl INTEGER,
    policies TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- AppRole Secret IDs
CREATE TABLE vault_approle_secret_ids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approle_id UUID REFERENCES vault_approles(id),
    secret_id_hash VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);
```

**API Endpoints:**
```
# UserPass
POST   /v1/auth/userpass/users/:username    # Create user
GET    /v1/auth/userpass/users/:username    # Read user
POST   /v1/auth/userpass/users/:username    # Update user
DELETE /v1/auth/userpass/users/:username    # Delete user
POST   /v1/auth/userpass/login/:username    # Login

# AppRole
POST   /v1/auth/approle/role/:role_name     # Create role
GET    /v1/auth/approle/role/:role_name    # Read role
POST   /v1/auth/approle/role/:role_name/secret-id # Generate secret ID
POST   /v1/auth/approle/login              # Login with role_id and secret_id

# Token
POST   /v1/auth/token/create                # Create token
GET    /v1/auth/token/lookup/:token         # Lookup token
POST   /v1/auth/token/revoke/:token         # Revoke token
POST   /v1/auth/token/revoke-self           # Revoke own token
```

---

### Phase 4: PKI Module Implementation

**Priority**: MEDIUM (Useful for certificate management)

**Files to Create:**
```
src/modules/pki/
├── mod.rs              # Main PKI module
├── ca.rs               # CA management
├── certificate.rs      # Certificate operations
├── revocation.rs       # Certificate revocation
├── ocsp.rs             # OCSP responder
└── crl.rs              # CRL generation
```

**Implementation Steps:**

1. **CA Management**
   - Root CA generation
   - Intermediate CA creation
   - CA certificate storage

2. **Certificate Issuing**
   - Certificate signing requests (CSR) processing
   - Certificate generation (RSA, ECC, SM2)
   - Certificate storage

3. **Certificate Revocation**
   - Revocation list management
   - CRL generation
   - OCSP responder

**Dependencies:**
- `x509` or `rcgen` for certificate generation
- `rustls` or `openssl` for crypto operations

**API Endpoints:**
```
POST   /v1/pki/config/ca                  # Configure CA
GET    /v1/pki/ca/pem                     # Get CA certificate
POST   /v1/pki/issue/:role_name           # Issue certificate
GET    /v1/pki/cert/:serial               # Get certificate
POST   /v1/pki/revoke/:serial             # Revoke certificate
GET    /v1/pki/crl                        # Get CRL
GET    /v1/pki/ocsp                       # OCSP endpoint
```

---

### Phase 5: Realm Module Implementation

**Priority**: MEDIUM (Useful for multi-tenancy)

**Files to Create:**
```
src/modules/realm/
├── mod.rs              # Main realm module
└── realm_manager.rs    # Realm management
```

**Implementation Steps:**

1. **Realm Structure**
   - Realm creation/deletion
   - Realm isolation
   - Realm-specific mounts and auth methods

2. **Realm Routing**
   - Path-based realm detection (`/v1/realm/{realm_id}/...`)
   - Realm context in requests
   - Realm-scoped operations

**Database Schema:**
```sql
CREATE TABLE vault_realms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**
```
GET    /v1/sys/realm                      # List realms
POST   /v1/sys/realm                      # Create realm
GET    /v1/sys/realm/:name                # Read realm
POST   /v1/sys/realm/:name                # Update realm
DELETE /v1/sys/realm/:name                # Delete realm
```

---

### Phase 6: Additional Modules

**Priority**: LOW (Nice to have)

#### Crypto Abstraction Module
- Abstract crypto operations
- Support multiple backends (ring, openssl, tongsuo)
- Currently using `aes-gcm` directly - can add abstraction layer later

#### Quota Module
- Resource quota management
- Rate limiting per user/role
- Storage quotas

#### Rate Limit Module
- Token bucket algorithm
- Per-endpoint rate limiting
- Per-user rate limiting

#### System Module
- System-level operations
- Metrics collection
- Health checks
- Audit logging

---

### Phase 7: API Endpoints & Infrastructure

**Mount Management Endpoints:**
```
GET    /v1/sys/mounts                     # List mounts
POST   /v1/sys/mounts/:path               # Enable mount
DELETE /v1/sys/mounts/:path               # Disable mount
POST   /v1/sys/mounts/:path/tune          # Tune mount
```

**Auth Method Management:**
```
GET    /v1/sys/auth                       # List auth methods
POST   /v1/sys/auth/:path                 # Enable auth method
DELETE /v1/sys/auth/:path                 # Disable auth method
```

**Metrics:**
- Prometheus metrics endpoint
- System metrics (CPU, memory, etc.)
- Request metrics (latency, throughput)

**CLI Commands** (Optional):
- Can be added later if needed
- Or use HTTP API directly
- Or create a separate CLI tool

---

## Implementation Checklist

### Immediate (Fix Compilation)
- [ ] Fix Axum router state setup
- [ ] Refactor handlers to work without State extractor
- [ ] Test all existing endpoints

### Phase 2: Policy Module
- [ ] Copy policy structures from RustyVault
- [ ] Create database migrations for policies
- [ ] Implement PolicyStore with PostgreSQL
- [ ] Implement ACL evaluation engine
- [ ] Add policy CRUD API endpoints
- [ ] Add capability check endpoint
- [ ] Write tests

### Phase 3: Auth Module
- [ ] Implement token management
- [ ] Implement UserPass authentication
- [ ] Implement AppRole authentication
- [ ] Implement certificate authentication
- [ ] Add MFA support (TOTP)
- [ ] Add OAuth2 support (optional)
- [ ] Add SAML support (optional)
- [ ] Write tests

### Phase 4: PKI Module
- [ ] Implement CA management
- [ ] Implement certificate issuing
- [ ] Implement certificate revocation
- [ ] Add CRL generation
- [ ] Add OCSP responder
- [ ] Write tests

### Phase 5: Realm Module
- [ ] Implement realm management
- [ ] Implement realm routing
- [ ] Add realm isolation
- [ ] Write tests

### Phase 6: Additional Modules
- [ ] Crypto abstraction (if needed)
- [ ] Quota management
- [ ] Rate limiting
- [ ] System operations

### Phase 7: API & Infrastructure
- [ ] Mount management endpoints
- [ ] Auth method management endpoints
- [ ] Metrics collection
- [ ] Audit logging

---

## Code Organization

### Module Structure
```
src/
├── main.rs                 # Entry point
├── lib.rs                  # Library exports
├── errors.rs               # Error types
├── config/                 # Configuration
├── core/                   # Vault core
├── storage/                # Storage layer
├── logical/                # Logical layer
├── router/                 # Request routing
├── modules/                 # Vault modules
│   ├── kv/                 # ✅ Implemented
│   ├── policy/             # 🚧 To implement
│   ├── auth/               # 🚧 To implement
│   ├── pki/                # 🚧 To implement
│   ├── realm/              # 🚧 To implement
│   ├── crypto/             # 🚧 Optional
│   ├── quota/              # 🚧 Optional
│   ├── ratelimit/          # 🚧 Optional
│   └── system/             # 🚧 Optional
└── http/                   # HTTP layer
    ├── routes.rs           # Route definitions
    ├── handlers/           # Request handlers
    │   ├── sys_handlers.rs
    │   ├── secrets_handlers.rs
    │   ├── policy_handlers.rs  # 🚧 To add
    │   ├── auth_handlers.rs    # 🚧 To add
    │   ├── pki_handlers.rs     # 🚧 To add
    │   └── realm_handlers.rs   # 🚧 To add
    └── middleware/         # Middleware
        └── auth_middleware.rs
```

---

## Testing Strategy

### Unit Tests
- Test each module independently
- Mock dependencies
- Test error cases

### Integration Tests
- Test API endpoints
- Test database operations
- Test encryption/decryption
- Test policy evaluation

### End-to-End Tests
- Test full workflows (init → unseal → create secret → read secret)
- Test authentication flows
- Test policy enforcement

---

## Migration from RustyVault

### Code Adaptation Checklist
- [ ] Replace `RvError` with `VaultError`
- [ ] Replace RustyVault storage with PostgreSQL `MetadataStore`
- [ ] Replace Actix-web with Axum
- [ ] Replace RustyVault config with health-v1 config
- [ ] Replace RustyVault logging with health-v1 tracing
- [ ] Adapt HCL parsing (simplify or keep as-is)
- [ ] Update dependencies to match health-v1 workspace

### Key Differences
1. **HTTP Framework**: Axum instead of Actix-web
2. **Database**: PostgreSQL for metadata instead of RustyVault storage
3. **Configuration**: health-v1 config system
4. **Logging**: Tracing instead of RustyVault logging
5. **Error Handling**: health-v1 error patterns

---

## Performance Considerations

1. **Policy Evaluation**: Cache compiled policies
2. **ACL Lookups**: Use efficient data structures (Trie, DashMap)
3. **Token Validation**: Cache token lookups
4. **Database Queries**: Use connection pooling, indexes
5. **Encryption**: Use hardware acceleration when available

---

## Security Considerations

1. **Token Storage**: Hash tokens, never store plaintext
2. **Password Storage**: Use bcrypt with appropriate cost
3. **Secret Storage**: Always encrypted via barrier
4. **Policy Enforcement**: Validate all requests
5. **Audit Logging**: Log all sensitive operations
6. **Rate Limiting**: Prevent brute force attacks
7. **Input Validation**: Validate all inputs

---

## Next Steps

1. **Fix compilation errors** (Phase 1)
2. **Start with Policy module** (Phase 2) - most critical
3. **Then Auth module** (Phase 3) - required for security
4. **Then PKI/Realm** (Phases 4-5) - as needed
5. **Additional modules** (Phase 6) - nice to have
6. **API endpoints** (Phase 7) - complete the API surface

---

## Questions to Resolve

1. **HCL vs JSON/YAML**: Keep HCL parsing or simplify to JSON?
2. **Certificate Library**: Use `rcgen`, `x509`, or `openssl`?
3. **OAuth2/SAML**: Implement now or defer?
4. **CLI**: Needed or use HTTP API only?
5. **Metrics**: Prometheus format or custom?

---

This guide provides a comprehensive roadmap for implementing all RustyVault features in the health-v1 monorepo while keeping it as a separate service for security and operational benefits.

