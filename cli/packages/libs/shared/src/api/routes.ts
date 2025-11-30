/**
 * Unified API Routes
 * Centralized constants for all API endpoints across admin and client-app
 */

export const API_ROUTES = {
  // Health check
  HEALTH: "/health",

  // Authentication
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/token",
    USERINFO: "/auth/userinfo",
  },

  // Setup
  SETUP: {
    INITIALIZE: "/setup/initialize",
    STATUS: "/setup/status",
  },

  // Users
  USERS: {
    LIST: "/users",
    GET: (id: string) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },

  // Organizations
  ORGANIZATIONS: {
    LIST: "/organizations",
    GET: (id: string) => `/organizations/${id}`,
    CREATE: "/organizations",
    UPDATE: (id: string) => `/organizations/${id}`,
    DELETE: (id: string) => `/organizations/${id}`,
  },

  // Permissions
  PERMISSIONS: {
    LIST: "/permissions",
    GET: (id: string) => `/permissions/${id}`,
    CREATE: "/permissions",
    UPDATE: (id: string) => `/permissions/${id}`,
    DELETE: (id: string) => `/permissions/${id}`,
  },

  // Services
  SERVICES: {
    LIST: "/services",
    GET: (id: string) => `/services/${id}`,
    CREATE: "/services",
    UPDATE: (id: string) => `/services/${id}`,
    DELETE: (id: string) => `/services/${id}`,
    STATUS: "/api/services/status",
  },

  // Patients
  PATIENTS: {
    LIST: "/patients",
    GET: (id: string) => `/patients/${id}`,
    CREATE: "/patients",
    UPDATE: (id: string) => `/patients/${id}`,
    DELETE: (id: string) => `/patients/${id}`,
  },
} as const;
