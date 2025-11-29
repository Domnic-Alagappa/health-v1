/**
 * API Routes and Configuration
 * Centralized constants for all API endpoints
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
export const API_TIMEOUT = 30000 // 30 seconds

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

  // Users
  USERS: {
    LIST: "/users",
    GET: (id: string) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },

  // Patients
  PATIENTS: {
    LIST: "/patients",
    GET: (id: string) => `/patients/${id}`,
    CREATE: "/patients",
    UPDATE: (id: string) => `/patients/${id}`,
    DELETE: (id: string) => `/patients/${id}`,
  },
} as const
