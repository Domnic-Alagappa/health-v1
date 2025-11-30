/**
 * API Interceptors Tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { API_CONFIG } from "@health-v1/shared/api/config"
const API_BASE_URL = API_CONFIG.BASE_URL
import {
  getAccessToken,
  getRefreshToken,
  requestInterceptor,
  responseInterceptor,
  setTokens,
} from "./interceptors"

// Mock masking
vi.mock("./masking", () => ({
  maskObject: vi.fn((obj) => obj),
}))

describe("API Interceptors", () => {
  beforeEach(() => {
    setTokens(null, null)
  })

  describe("Token Management", () => {
    it("should set and get access token", () => {
      setTokens("access-token", "refresh-token")
      expect(getAccessToken()).toBe("access-token")
    })

    it("should set and get refresh token", () => {
      setTokens("access-token", "refresh-token")
      expect(getRefreshToken()).toBe("refresh-token")
    })

    it("should clear tokens when set to null", () => {
      setTokens("access-token", "refresh-token")
      setTokens(null, null)
      expect(getAccessToken()).toBeNull()
      expect(getRefreshToken()).toBeNull()
    })
  })

  describe("Request Interceptor", () => {
    it("should add authorization header when token is available", async () => {
      setTokens("test-token", null)

      const config = await requestInterceptor(`${API_BASE_URL}/test`, {
        method: "GET",
      })

      expect(config.headers?.Authorization).toBe("Bearer test-token")
    })

    it("should not add authorization header when token is not available", async () => {
      setTokens(null, null)

      const config = await requestInterceptor(`${API_BASE_URL}/test`, {
        method: "GET",
      })

      expect(config.headers?.Authorization).toBeUndefined()
    })

    it("should add request ID header", async () => {
      const config = await requestInterceptor(`${API_BASE_URL}/test`, {
        method: "GET",
      })

      expect(config.headers?.["X-Request-ID"]).toBeDefined()
      expect(typeof config.headers?.["X-Request-ID"]).toBe("string")
    })

    it("should add request timestamp header", async () => {
      const config = await requestInterceptor(`${API_BASE_URL}/test`, {
        method: "GET",
      })

      expect(config.headers?.["X-Request-Timestamp"]).toBeDefined()
      expect(config.headers?.["X-Request-Timestamp"]).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it("should preserve existing headers", async () => {
      const config = await requestInterceptor(`${API_BASE_URL}/test`, {
        method: "GET",
        headers: { "X-Custom-Header": "custom-value" },
      })

      expect(config.headers?.["X-Custom-Header"]).toBe("custom-value")
    })
  })

  describe("Response Interceptor", () => {
    it("should return successful response as-is", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ data: "success" }),
      }

      const result = await responseInterceptor(mockResponse as Response)
      expect(result).toEqual(mockResponse)
    })

    it("should handle 401 Unauthorized", async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ error: "Unauthorized" }),
      }

      await expect(responseInterceptor(mockResponse as Response)).rejects.toThrow()
    })

    it("should handle 403 Forbidden", async () => {
      const mockResponse = {
        ok: false,
        status: 403,
        json: async () => ({ error: "Forbidden" }),
      }

      await expect(responseInterceptor(mockResponse as Response)).rejects.toThrow()
    })

    it("should handle 500 Server Error", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        json: async () => ({ error: "Internal Server Error" }),
      }

      await expect(responseInterceptor(mockResponse as Response)).rejects.toThrow()
    })
  })
})
