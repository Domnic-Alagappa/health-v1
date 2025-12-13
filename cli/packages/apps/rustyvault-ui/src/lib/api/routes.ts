/**
 * RustyVault API Routes
 * Centralized constants for all RustyVault service endpoints
 * 
 * Note: The base URL already includes /v1, so routes here are relative
 * (e.g., '/sys/health' becomes '/v1/sys/health')
 */

export const VAULT_ROUTES = {
  // System routes
  SYS: {
    HEALTH: '/sys/health',
    SEAL_STATUS: '/sys/seal-status',
    SEAL: '/sys/seal',
    UNSEAL: '/sys/unseal',
    INIT: '/sys/init',
    MOUNTS: '/sys/mounts',
    MOUNT: (path: string) => `/sys/mounts/${path}`,
    AUTH: '/sys/auth',
    AUTH_METHOD: (path: string) => `/sys/auth/${path}`,
  },

  // Auth routes
  AUTH: {
    USERPASS_LOGIN: (username: string) => `/auth/userpass/login/${username}`,
    USERPASS_USERS: '/auth/userpass/users',
    USERPASS_USER: (username: string) => `/auth/userpass/users/${username}`,
    APPROLE_LOGIN: '/auth/approle/login',
    TOKEN_CREATE: '/auth/token/create',
    TOKEN_LOOKUP: '/auth/token/lookup',
    TOKEN_LOOKUP_SELF: '/auth/token/lookup-self',
    TOKEN_RENEW: '/auth/token/renew',
    TOKEN_RENEW_SELF: '/auth/token/renew-self',
    TOKEN_REVOKE: '/auth/token/revoke',
    TOKEN_REVOKE_SELF: '/auth/token/revoke-self',
  },

  // Policy routes
  POLICIES: {
    LIST: '/sys/policies/acl',
    GET: (name: string) => `/sys/policies/acl/${name}`,
    CREATE: (name: string) => `/sys/policies/acl/${name}`,
    UPDATE: (name: string) => `/sys/policies/acl/${name}`,
    DELETE: (name: string) => `/sys/policies/acl/${name}`,
    CAPABILITIES: '/sys/capabilities',
  },

  // Secret routes (KV v1)
  SECRETS: {
    READ: (path: string) => `/secret/${path}`,
    WRITE: (path: string) => `/secret/${path}`,
    DELETE: (path: string) => `/secret/${path}`,
    LIST: (path: string = '') => path ? `/secret/${path}/` : '/secret/',
  },

  // Realm routes
  REALMS: {
    LIST: '/sys/realm',
    GET: (id: string) => `/sys/realm/${id}`,
    CREATE: (id: string) => `/sys/realm/${id}`,
    UPDATE: (id: string) => `/sys/realm/${id}`,
    DELETE: (id: string) => `/sys/realm/${id}`,
  },
} as const;

