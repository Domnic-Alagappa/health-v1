/**
 * API Client Configuration
 * Centralized API client with environment-based configuration
 */

import { env } from "../env"

export const API_CONFIG = {
  BASE_URL: env.VITE_API_BASE_URL || "http://localhost:8080",
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000, // 30 seconds
  RETRY_ATTEMPTS: Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
  RETRY_DELAY: Number(import.meta.env.VITE_API_RETRY_DELAY) || 1000, // 1 second
} as const

/**
 * API Routes
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
} as const

/**
 * Create full API URL
 */
export function getApiUrl(path: string): string {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, "")
  const apiPath = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl}${apiPath}`
}

/**
 * API Client with fetch wrapper
 */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(path)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
        status: response.status,
      }))
      throw new Error(error.message || `API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout")
    }
    throw error
  }
}

