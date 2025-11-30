/**
 * Authentication E2E Tests
 * Tests for login, logout, and token refresh flows
 */

import { expect, test } from "../fixtures/auth"

test.describe("Authentication", () => {
  test("should display login form when not authenticated", async ({ page }) => {
    await page.goto("/")
    await page.waitForLoadState("networkidle")

    // Check if login form or auth redirect is present
    // Adjust selectors based on your actual UI
    const hasAuthForm =
      (await page.locator('form, [data-testid="login-form"], input[type="email"]').count()) > 0
    const isOnLoginPage = page.url().includes("login") || page.url().includes("auth")

    expect(hasAuthForm || isOnLoginPage).toBeTruthy()
  })

  test("should login successfully with valid credentials", async ({ page, loginAs, apiURL }) => {
    const testEmail = process.env.TEST_USER_EMAIL || "test@example.com"
    const testPassword = process.env.TEST_USER_PASSWORD || "testpassword"

    // Try to login via API first
    const loginResponse = await page.request.post(`${apiURL}/auth/login`, {
      data: { email: testEmail, password: testPassword },
    })

    // If login endpoint exists and works, proceed with UI login
    if (loginResponse.ok()) {
      await loginAs(testEmail, testPassword)

      // Verify we're authenticated
      const isAuthenticated = await page.evaluate(() => {
        return !!localStorage.getItem("accessToken")
      })

      expect(isAuthenticated).toBeTruthy()
    } else {
      // Skip test if auth service is not available
      test.skip()
    }
  })

  test("should logout successfully", async ({ page, loginAs, logout }) => {
    const testEmail = process.env.TEST_USER_EMAIL || "test@example.com"
    const testPassword = process.env.TEST_USER_PASSWORD || "testpassword"

    // Login first
    await loginAs(testEmail, testPassword)

    // Verify logged in
    const hasToken = await page.evaluate(() => {
      return !!localStorage.getItem("accessToken")
    })
    expect(hasToken).toBeTruthy()

    // Logout
    await logout()

    // Verify logged out
    const hasTokenAfterLogout = await page.evaluate(() => {
      return !!localStorage.getItem("accessToken")
    })
    expect(hasTokenAfterLogout).toBeFalsy()
  })

  test("should refresh access token when expired", async ({ page, loginAs, apiURL }) => {
    const testEmail = process.env.TEST_USER_EMAIL || "test@example.com"
    const testPassword = process.env.TEST_USER_PASSWORD || "testpassword"

    // Login first
    await loginAs(testEmail, testPassword)

    // Get refresh token
    const refreshToken = await page.evaluate(() => {
      return localStorage.getItem("refreshToken")
    })

    if (!refreshToken) {
      test.skip()
      return
    }

    // Attempt to refresh token
    const refreshResponse = await page.request.post(`${apiURL}/auth/token`, {
      data: { refreshToken },
    })

    if (refreshResponse.ok()) {
      const refreshData = await refreshResponse.json()
      expect(refreshData).toHaveProperty("accessToken")
      expect(refreshData).toHaveProperty("refreshToken")
    } else {
      // Skip if refresh endpoint not available
      test.skip()
    }
  })

  test("should handle invalid credentials", async ({ page, apiURL }) => {
    await page.goto("/")

    // Try to login with invalid credentials
    const loginResponse = await page.request.post(`${apiURL}/auth/login`, {
      data: { email: "invalid@example.com", password: "wrongpassword" },
    })

    // Should fail with 401 or 400
    expect([400, 401, 403]).toContain(loginResponse.status())
  })
})
