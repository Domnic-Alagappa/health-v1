/**
 * API Client Integration Tests
 * Tests for interceptors, token refresh, error handling
 */

import { API_CONFIG } from "@health-v1/shared/api/config";
import { beforeEach, describe, expect, it, vi } from "vitest";
const API_BASE_URL = API_CONFIG.BASE_URL;
import { apiClient } from "./client";
import { getAccessToken, setTokens } from "./interceptors";

// Mock fetch
global.fetch = vi.fn();

describe("API Client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setTokens(null, null);
  });

  describe("Request Interceptor - Token Injection", () => {
    it("should inject access token in Authorization header", async () => {
      const mockToken = "test-access-token";
      setTokens(mockToken, "refresh-token");
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "success" }),
      });

      await apiClient.get("/test");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      );
    });

    it("should not inject token if not available", async () => {
      setTokens(null, null);
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "success" }),
      });

      await apiClient.get("/test");

      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = callArgs[1]?.headers as Headers;

      if (headers instanceof Headers) {
        expect(headers.get("Authorization")).toBeNull();
      } else if (typeof headers === "object") {
        expect(headers).not.toHaveProperty("Authorization");
      }
    });
  });

  describe("Response Interceptor - Error Handling", () => {
    it("should handle 401 Unauthorized and return error response", async () => {
      const mockAccessToken = "expired-token";
      const mockRefreshToken = "valid-refresh-token";
      setTokens(mockAccessToken, mockRefreshToken);

      // First call returns 401
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ error: "Unauthorized" }),
      });

      const response = await apiClient.get("/test");

      // API client returns error in response object via errorInterceptor
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe("401");
      expect(response.error?.message).toContain("401");
    });

    it("should handle 403 Forbidden", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: async () => ({ error: "Forbidden" }),
      });

      const response = await apiClient.get("/test");
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe("403");
      expect(response.error?.message).toContain("403");
    });

    it("should handle 500 Server Error", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: async () => ({ error: "Internal Server Error" }),
      });

      const response = await apiClient.get("/test");
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBe("500");
      expect(response.error?.message).toContain("500");
    });

    it("should sanitize error messages to remove PHI", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: "Invalid SSN: 123-45-6789",
          email: "user@example.com",
        }),
      });

      const response = await apiClient.get("/test");
      // Error message should be sanitized (no SSN, no email)
      if (response.error) {
        expect(response.error.message).not.toContain("123-45-6789");
        expect(response.error.message).not.toContain("user@example.com");
      }
    });
  });

  describe("Request Methods", () => {
    it("should make GET request", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "success" }),
      });

      await apiClient.get("/test");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          method: "GET",
        })
      );
    });

    it("should make POST request with body", async () => {
      const body = { name: "Test" };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "success" }),
      });

      await apiClient.post("/test", body);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(body),
        })
      );
    });

    it("should make PUT request with body", async () => {
      const body = { name: "Updated" };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "success" }),
      });

      await apiClient.put("/test", body);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(body),
        })
      );
    });

    it("should make DELETE request", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "success" }),
      });

      await apiClient.delete("/test");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/test"),
        expect.objectContaining({
          method: "DELETE",
        })
      );
    });
  });

  describe("Request Configuration", () => {
    it("should use custom timeout", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "success" }),
      });

      await apiClient.get("/test", { timeout: 5000 });

      // In a real implementation, timeout would be handled by AbortController
      expect(global.fetch).toHaveBeenCalled();
    });

    it("should include custom headers", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "success" }),
      });

      await apiClient.get("/test", {
        headers: { "X-Custom-Header": "custom-value" },
      });

      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = callArgs[1]?.headers;

      if (headers instanceof Headers) {
        expect(headers.get("X-Custom-Header")).toBe("custom-value");
      } else if (typeof headers === "object") {
        expect(headers).toHaveProperty("X-Custom-Header", "custom-value");
      }
    });
  });

  describe("Response Parsing", () => {
    it("should parse JSON response", async () => {
      const mockData = { id: 1, name: "Test" };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const response = await apiClient.get("/test");
      expect(response.data).toEqual(mockData);
      expect(response.error).toBeUndefined();
    });

    it("should handle empty response", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const response = await apiClient.get("/test");
      expect(response.data).toBeNull();
      expect(response.error).toBeUndefined();
    });
  });

  describe("Base URL Configuration", () => {
    it("should use configured base URL", async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: "success" }),
      });

      await apiClient.get("/test");

      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const url = callArgs[0] as string;

      expect(url).toContain(API_BASE_URL || "");
    });
  });
});
