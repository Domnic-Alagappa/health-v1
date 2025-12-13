# RustyVault Features Implementation Plan

## Current Status
- ✅ Core infrastructure (VaultCore, Barrier, Shamir, Storage)
- ✅ KV secrets engine
- 🚧 Compilation errors in routing layer (needs fix)
- ❌ All other modules are placeholders

## Implementation Priority

### Phase 1: Fix Compilation & Core Infrastructure
1. Fix Axum router state setup issues
2. Ensure basic vault operations work (init, seal, unseal, secrets)

### Phase 2: Policy Module (High Priority)
- ACL system for authorization
- Policy evaluation engine
- Policy CRUD operations
- Required for security

### Phase 3: Auth Module (High Priority)
- UserPass authentication
- AppRole authentication
- Token management
- Basic auth methods first, then MFA/OAuth2/SAML

### Phase 4: PKI Module (Medium Priority)
- Certificate issuing
- Certificate revocation
- CA management
- OCSP/CRL support

### Phase 5: Realm Module (Medium Priority)
- Realm management
- Realm isolation
- Realm-specific mounts

### Phase 6: Additional Modules (Low Priority)
- Crypto abstraction
- Quota management
- Rate limiting
- System operations

### Phase 7: API Endpoints & Infrastructure
- Mount management endpoints
- Auth method management endpoints
- Policy management endpoints
- Realm management endpoints
- PKI operation endpoints
- Metrics collection
- CLI commands (optional)

## Implementation Strategy

1. **Copy & Adapt**: Start with RustyVault's implementations
2. **Integrate**: Adapt to health-v1 infrastructure (PostgreSQL, Axum, etc.)
3. **Simplify**: Remove dependencies we don't need (HCL parsing can be simplified)
4. **Test**: Add integration tests as we go

## Files to Create/Modify

### Policy Module
- `src/modules/policy/mod.rs` - Main module
- `src/modules/policy/policy.rs` - Policy structures and parsing
- `src/modules/policy/acl.rs` - ACL evaluation
- `src/modules/policy/policy_store.rs` - Policy storage (PostgreSQL)

### Auth Module
- `src/modules/auth/mod.rs` - Main auth module
- `src/modules/auth/userpass.rs` - Username/password auth
- `src/modules/auth/approle.rs` - AppRole auth
- `src/modules/auth/cert.rs` - Certificate auth
- `src/modules/auth/token.rs` - Token management
- `src/modules/auth/mfa.rs` - MFA support
- `src/modules/auth/oauth2.rs` - OAuth2 support
- `src/modules/auth/saml.rs` - SAML support

### PKI Module
- `src/modules/pki/mod.rs` - Main PKI module
- `src/modules/pki/ca.rs` - CA management
- `src/modules/pki/certificate.rs` - Certificate operations
- `src/modules/pki/revocation.rs` - Certificate revocation
- `src/modules/pki/ocsp.rs` - OCSP support
- `src/modules/pki/crl.rs` - CRL support

### Realm Module
- `src/modules/realm/mod.rs` - Main realm module
- `src/modules/realm/realm_manager.rs` - Realm management

### Additional Modules
- `src/modules/crypto/mod.rs` - Crypto abstraction
- `src/modules/quota/mod.rs` - Quota management
- `src/modules/ratelimit/mod.rs` - Rate limiting
- `src/modules/system/mod.rs` - System operations

### API Endpoints
- `src/http/handlers/policy_handlers.rs` - Policy endpoints
- `src/http/handlers/auth_handlers.rs` - Auth endpoints
- `src/http/handlers/pki_handlers.rs` - PKI endpoints
- `src/http/handlers/realm_handlers.rs` - Realm endpoints
- `src/http/handlers/mount_handlers.rs` - Mount endpoints

