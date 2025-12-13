/**
 * Unified API Routes
 * Centralized constants for all API endpoints across admin and client-app
 * 
 * All routes use /v1/ prefix for API versioning.
 * The /api prefix is automatically added by getApiUrl() function.
 * Health check and auth routes are excluded from /api prefix.
 */

export const API_ROUTES = {
  // Health check (unversioned, no /api prefix)
  HEALTH: "/health",

  // Authentication (versioned, no /api prefix)
  AUTH: {
    LOGIN: "/v1/auth/login",
    LOGOUT: "/v1/auth/logout",
    REFRESH: "/v1/auth/token",
    USERINFO: "/v1/auth/userinfo",
  },

  // Setup (versioned, gets /api prefix)
  SETUP: {
    INITIALIZE: "/v1/setup/initialize",
    STATUS: "/v1/setup/status",
  },

  // Users (versioned, gets /api prefix)
  USERS: {
    LIST: "/v1/users",
    GET: (id: string) => `/v1/users/${id}`,
    CREATE: "/v1/users",
    UPDATE: (id: string) => `/v1/users/${id}`,
    DELETE: (id: string) => `/v1/users/${id}`,
  },

  // Organizations (versioned, gets /api prefix)
  ORGANIZATIONS: {
    LIST: "/v1/organizations",
    GET: (id: string) => `/v1/organizations/${id}`,
    CREATE: "/v1/organizations",
    UPDATE: (id: string) => `/v1/organizations/${id}`,
    DELETE: (id: string) => `/v1/organizations/${id}`,
  },

  // Permissions (versioned, gets /api prefix)
  PERMISSIONS: {
    LIST: "/v1/permissions",
    GET: (id: string) => `/v1/permissions/${id}`,
    CREATE: "/v1/permissions",
    UPDATE: (id: string) => `/v1/permissions/${id}`,
    DELETE: (id: string) => `/v1/permissions/${id}`,
  },

  // Services (versioned, gets /api prefix)
  SERVICES: {
    LIST: "/v1/services",
    GET: (id: string) => `/v1/services/${id}`,
    CREATE: "/v1/services",
    UPDATE: (id: string) => `/v1/services/${id}`,
    DELETE: (id: string) => `/v1/services/${id}`,
    STATUS: "/v1/services/status",
  },

  // Patients (versioned, gets /api prefix)
  PATIENTS: {
    LIST: "/v1/patients",
    GET: (id: string) => `/v1/patients/${id}`,
    CREATE: "/v1/patients",
    UPDATE: (id: string) => `/v1/patients/${id}`,
    DELETE: (id: string) => `/v1/patients/${id}`,
  },

  // Admin - Permissions (versioned, gets /api prefix)
  ADMIN: {
    PERMISSIONS: {
      CHECK: "/v1/admin/permissions/check",
      CHECK_BATCH: "/v1/admin/permissions/check-batch",
      USER: (id: string) => `/v1/admin/permissions/user/${id}`,
      USER_PAGES: (id: string) => `/v1/admin/permissions/user/${id}/pages`,
      USER_BUTTONS: (id: string, page: string) => `/v1/admin/permissions/user/${id}/buttons/${page}`,
      USER_FIELDS: (id: string, page: string) => `/v1/admin/permissions/user/${id}/fields/${page}`,
      ASSIGN: "/v1/admin/permissions/assign",
      ASSIGN_BATCH: "/v1/admin/permissions/assign-batch",
      REVOKE: "/v1/admin/permissions/revoke",
    },
    UI: {
      PAGES: "/v1/admin/ui/pages",
      PAGES_BUTTONS: (id: string) => `/v1/admin/ui/pages/${id}/buttons`,
      PAGES_FIELDS: (id: string) => `/v1/admin/ui/pages/${id}/fields`,
      BUTTONS: "/v1/admin/ui/buttons",
      FIELDS: "/v1/admin/ui/fields",
      APIS: "/v1/admin/ui/apis",
    },
    GROUPS: {
      LIST: "/v1/admin/groups",
      GET: (id: string) => `/v1/admin/groups/${id}`,
      CREATE: "/v1/admin/groups",
      UPDATE: (id: string) => `/v1/admin/groups/${id}`,
      DELETE: (id: string) => `/v1/admin/groups/${id}`,
      ADD_USER: (groupId: string, userId: string) => `/v1/admin/groups/${groupId}/users/${userId}`,
      REMOVE_USER: (groupId: string, userId: string) => `/v1/admin/groups/${groupId}/users/${userId}`,
      ASSIGN_ROLE: (groupId: string, roleId: string) => `/v1/admin/groups/${groupId}/roles/${roleId}`,
    },
    DASHBOARD: {
      STATS: "/v1/admin/dashboard/stats",
    },
    ROLES: {
      LIST: "/v1/admin/roles",
      GET: (id: string) => `/v1/admin/roles/${id}`,
      CREATE: "/v1/admin/roles",
      UPDATE: (id: string) => `/v1/admin/roles/${id}`,
      DELETE: (id: string) => `/v1/admin/roles/${id}`,
      ASSIGN: "/v1/admin/roles/assign",
    },
    RELATIONSHIPS: {
      LIST: "/v1/admin/relationships",
      CHECK: "/v1/relationships/check",
      BATCH_CHECK: "/v1/relationships/batch-check",
      USER: (userId: string) => `/v1/relationships/user/${userId}`,
      CREATE: "/v1/relationships",
      DELETE: (id: string) => `/v1/relationships/${id}`,
    },
    ENCRYPTION: {
      DEK_STATUS: (userId: string) => `/v1/admin/encryption/deks/${userId}/status`,
      DEKS: "/v1/admin/encryption/deks",
      DEK_ROTATE: "/v1/admin/encryption/deks/rotate",
      MASTER_KEY_STATUS: "/v1/admin/encryption/master-key/status",
      MASTER_KEY_ROTATE: "/v1/admin/encryption/master-key/rotate",
      STATS: "/v1/admin/encryption/stats",
    },
  },
} as const;
