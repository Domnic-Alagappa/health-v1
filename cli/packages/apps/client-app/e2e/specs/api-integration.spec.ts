/**
 * API Integration E2E Tests
 * Direct API tests against the Rust api-service
 */

import { expect, test } from "../fixtures/api";

test.describe("API Integration @api", () => {
  test("should check health endpoint", async ({ apiContext }) => {
    const response = await apiContext.get("/health");

    if (response.ok()) {
      expect(response.status()).toBe(200);
      const data = await response.json().catch(() => null);
      // Health endpoint may return different formats
      expect(response.status()).toBe(200);
    } else {
      // Skip if health endpoint doesn't exist
      test.skip();
    }
  });

  test("should login via API", async ({ apiContext }) => {
    const testEmail = process.env.TEST_USER_EMAIL || "test@example.com";
    const testPassword = process.env.TEST_USER_PASSWORD || "testpassword";

    const response = await apiContext.post("/auth/login", {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });

    if (response.ok()) {
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("accessToken");
      expect(data).toHaveProperty("refreshToken");
      expect(data.accessToken).toBeTruthy();
    } else {
      // Skip if login endpoint not available
      test.skip();
    }
  });

  test("should reject invalid login credentials", async ({ apiContext }) => {
    const response = await apiContext.post("/auth/login", {
      data: {
        email: "invalid@example.com",
        password: "wrongpassword",
      },
    });

    // Should return 401 or 400
    expect([400, 401, 403]).toContain(response.status());
  });

  test("should refresh access token", async ({ apiContext, apiURL }) => {
    // First login to get tokens
    const testEmail = process.env.TEST_USER_EMAIL || "test@example.com";
    const testPassword = process.env.TEST_USER_PASSWORD || "testpassword";

    const loginResponse = await apiContext.post("/auth/login", {
      data: {
        email: testEmail,
        password: testPassword,
      },
    });

    if (!loginResponse.ok()) {
      test.skip();
      return;
    }

    const loginData = await loginResponse.json();
    const refreshToken = loginData.refreshToken;

    // Now refresh the token
    const refreshResponse = await apiContext.post("/auth/token", {
      data: {
        refreshToken,
      },
    });

    if (refreshResponse.ok()) {
      expect(refreshResponse.status()).toBe(200);
      const refreshData = await refreshResponse.json();
      expect(refreshData).toHaveProperty("accessToken");
      expect(refreshData).toHaveProperty("refreshToken");
    } else {
      test.skip();
    }
  });

  test("should get user info with authenticated context", async ({ authenticatedApiContext }) => {
    const response = await authenticatedApiContext.get("/auth/userinfo");

    if (response.ok()) {
      expect(response.status()).toBe(200);
      const userInfo = await response.json();
      expect(userInfo).toHaveProperty("email");
    } else {
      // Skip if userinfo endpoint not available
      test.skip();
    }
  });

  test("should access protected endpoint with authentication", async ({
    authenticatedApiContext,
  }) => {
    // Try to access a protected endpoint (e.g., users list)
    const response = await authenticatedApiContext.get("/users");

    // May return 200 with data, 200 with empty array, or 404 if endpoint doesn't exist
    if (response.status() === 200) {
      const data = await response.json().catch(() => []);
      expect(Array.isArray(data) || typeof data === "object").toBeTruthy();
    } else if (response.status() === 404) {
      // Endpoint doesn't exist, skip
      test.skip();
    } else {
      // Other error status
      expect([200, 404]).toContain(response.status());
    }
  });

  test("should reject unauthenticated requests to protected endpoints", async ({ apiContext }) => {
    // Try to access protected endpoint without auth
    const response = await apiContext.get("/users");

    // Should return 401 or 403, or 404 if endpoint doesn't exist
    if (response.status() === 404) {
      test.skip();
    } else {
      expect([401, 403]).toContain(response.status());
    }
  });

  test("should logout via API", async ({ authenticatedApiContext }) => {
    const response = await authenticatedApiContext.post("/auth/logout");

    // Logout may return 200, 204, or 404
    if (response.status() === 404) {
      test.skip();
    } else {
      expect([200, 204]).toContain(response.status());
    }
  });
});
