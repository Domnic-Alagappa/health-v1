/**
 * API Routes and Configuration
 * Re-export from shared package
 */

export { API_CONFIG, API_ROUTES, getApiUrl } from "@health-v1/shared/api"

// Legacy exports for backward compatibility
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000 // 30 seconds
export const API_RETRY_ATTEMPTS = Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3
export const API_RETRY_DELAY = Number(import.meta.env.VITE_API_RETRY_DELAY) || 1000 // 1 second
