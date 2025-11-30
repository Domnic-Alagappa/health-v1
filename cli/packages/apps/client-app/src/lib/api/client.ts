/**
 * API Client
 * Secure fetch wrapper with interceptors, token refresh, and error handling
 */

import { API_ROUTES } from "@health-v1/shared/api/routes"
import { API_CONFIG } from "@health-v1/shared/api/config"
const API_BASE_URL = API_CONFIG.BASE_URL
const API_TIMEOUT = API_CONFIG.TIMEOUT
import {
  errorInterceptor,
  requestInterceptor,
  responseInterceptor,
  setTokens,
} from "./interceptors"
import type { ApiError, ApiResponse, RequestConfig } from "./types"

export class ApiClient {
  private baseUrl: string
  private defaultTimeout: number
  private retryAttempts: number
  private retryDelay: number

  constructor(
    baseUrl: string = API_BASE_URL,
    timeout: number = API_TIMEOUT,
    retryAttempts: number = Number(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
    retryDelay: number = Number(import.meta.env.VITE_API_RETRY_DELAY) || 1000
  ) {
    this.baseUrl = baseUrl
    this.defaultTimeout = timeout
    this.retryAttempts = retryAttempts
    this.retryDelay = retryDelay
  }

  /**
   * Make an API request with automatic token injection, error handling, and retry logic
   */
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const timeout = config.timeout || this.defaultTimeout

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      // Apply request interceptor
      const interceptedConfig = await requestInterceptor(url, {
        ...config,
        signal: config.signal || controller.signal,
      })

      // Make request
      const response = await fetch(url, {
        method: config.method || "GET",
        headers: interceptedConfig.headers,
        body: config.body ? JSON.stringify(config.body) : undefined,
        signal: interceptedConfig.signal,
      })

      clearTimeout(timeoutId)

      // Handle non-OK responses
      if (!response.ok) {
        // Apply error interceptor
        const error = errorInterceptor(response, url)
        return {
          error,
        }
      }

      // Apply response interceptor
      return await responseInterceptor<T>(response, url)
    } catch (error) {
      clearTimeout(timeoutId)

      // Handle abort (timeout)
      if (error instanceof Error && error.name === "AbortError") {
        return {
          error: {
            message: "Request timeout",
            code: "TIMEOUT",
          },
        }
      }

      // Apply error interceptor
      const apiError = errorInterceptor(error, url)
      return {
        error: apiError,
      }
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    config?: Omit<RequestConfig, "method" | "body">
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "GET" })
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, "method" | "body">
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "POST", body })
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, "method" | "body">
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "PUT", body })
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    config?: Omit<RequestConfig, "method" | "body">
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "PATCH", body })
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    config?: Omit<RequestConfig, "method" | "body">
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" })
  }

  /**
   * Set authentication tokens
   */
  setAuthTokens(accessToken: string | null, refreshToken: string | null): void {
    setTokens(accessToken, refreshToken)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()
