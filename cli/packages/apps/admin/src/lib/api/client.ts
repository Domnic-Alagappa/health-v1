/**
 * API Client Configuration
 * Re-export from shared package with admin-specific overrides if needed
 */

import { env } from "../env"
import { API_CONFIG as SHARED_API_CONFIG, API_ROUTES, getApiUrl } from "@health-v1/shared/api"

// Use shared config but allow admin-specific env overrides
export const API_CONFIG = {
  ...SHARED_API_CONFIG,
  BASE_URL: env.VITE_API_BASE_URL || SHARED_API_CONFIG.BASE_URL,
} as const

// Re-export routes and getApiUrl from shared
export { API_ROUTES, getApiUrl }

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

