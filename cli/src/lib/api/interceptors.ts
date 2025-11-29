/**
 * API Interceptors
 * Request and response interceptors for security, audit logging, and error handling
 */

import { API_BASE_URL } from "@/lib/constants/api"
import { SECURITY_CONFIG } from "@/lib/constants/security"
import { maskObject } from "./masking"
import type { ApiResponse, RequestConfig } from "./types"

let accessToken: string | null = null
let refreshToken: string | null = null
let refreshPromise: Promise<string> | null = null

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access
  refreshToken = refresh
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string | null {
  return refreshToken
}

/**
 * Request interceptor - adds auth token, request ID, and timestamp
 */
export async function requestInterceptor(
  url: string,
  config: RequestConfig
): Promise<RequestConfig> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...config.headers,
  }

  // Add authorization token if available
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  // Add request ID for audit trail
  const requestId = crypto.randomUUID()
  headers["X-Request-ID"] = requestId

  // Add timestamp
  headers["X-Request-Timestamp"] = new Date().toISOString()

  return {
    ...config,
    headers,
  }
}

/**
 * Response interceptor - handles 401, 403, masks sensitive data, logs PHI access
 */
export async function responseInterceptor<T>(
  response: Response,
  url: string
): Promise<ApiResponse<T>> {
  // Handle 401 Unauthorized - trigger token refresh
  if (response.status === 401) {
    if (refreshToken && !refreshPromise) {
      refreshPromise = refreshAccessToken()
      try {
        const newToken = await refreshPromise
        accessToken = newToken
        // Retry original request with new token
        // This would be handled by the API client
      } catch (error) {
        // Refresh failed, clear tokens and redirect to login
        setTokens(null, null)
        window.location.href = "/login"
        throw error
      } finally {
        refreshPromise = null
      }
    } else {
      // No refresh token, redirect to login
      setTokens(null, null)
      window.location.href = "/login"
    }
  }

  // Handle 403 Forbidden - log and show access denied
  if (response.status === 403) {
    // Log unauthorized access attempt
    console.warn("Access denied:", url)
    // This would trigger audit logging
    throw new Error("Access denied")
  }

  // Parse response
  let data: T
  try {
    data = await response.json()
  } catch {
    // Not JSON, return text
    const text = await response.text()
    data = text as unknown as T
  }

  // Mask sensitive fields in response before caching
  if (SECURITY_CONFIG.AUDIT.LOG_PHI_ACCESS && typeof data === "object" && data !== null) {
    const fieldsToMask = ["ssn", "email", "phone", "mrn", "creditCard"]
    data = maskObject(data as Record<string, unknown>, fieldsToMask) as T
  }

  // Log PHI access for audit
  if (SECURITY_CONFIG.AUDIT.LOG_PHI_ACCESS) {
    // This would send to audit log
    console.debug("PHI access logged:", url)
  }

  return {
    data,
  }
}

/**
 * Error interceptor - sanitizes error messages, removes PHI
 */
export function errorInterceptor(error: unknown, url: string): ApiError {
  // Sanitize error messages to remove any PHI
  let message = "An error occurred"
  let code: string | undefined

  if (error instanceof Error) {
    message = error.message
    // Remove any potential PHI from error messages
    message = sanitizeErrorMessage(message)
  }

  if (error instanceof Response) {
    code = error.status.toString()
    message = `HTTP ${error.status}: ${error.statusText}`
  }

  // Log error securely (masked)
  console.error("API Error:", { url, code, message: sanitizeErrorMessage(message) })

  return {
    message,
    code,
  }
}

/**
 * Sanitize error messages to remove potential PHI
 */
function sanitizeErrorMessage(message: string): string {
  // Remove email patterns
  message = message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]")

  // Remove SSN patterns
  message = message.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN]")

  // Remove phone patterns
  message = message.replace(/\b\d{3}-\d{3}-\d{4}\b/g, "[PHONE]")

  return message
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string> {
  if (!refreshToken) {
    throw new Error("No refresh token available")
  }

  const response = await fetch(`${API_BASE_URL}/auth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  })

  if (!response.ok) {
    throw new Error("Token refresh failed")
  }

  const data = await response.json()
  return data.accessToken
}
