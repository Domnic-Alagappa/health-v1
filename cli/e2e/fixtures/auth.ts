/**
 * Authentication Test Fixtures
 * Helpers for authentication flows in E2E tests
 */

import type { Page } from "@playwright/test"
import { test as base, expect } from "@playwright/test"

type AuthFixtures = {
  authenticatedPage: Page
  loginAs: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  apiURL: string
}

export const test = base.extend<AuthFixtures>({
  apiURL: async ({}, use) => {
    const apiURL = process.env.PLAYWRIGHT_API_URL || "http://localhost:8080"
    await use(apiURL)
  },

  loginAs: async ({ page }, use) => {
    const loginAs = async (email: string, password: string) => {
      const apiURL = process.env.PLAYWRIGHT_API_URL || "http://localhost:8080"

      // Navigate to login page or trigger login
      await page.goto("/")

      // Wait for the app to load
      await page.waitForLoadState("networkidle")

      // Check if we're already logged in
      const isAuthenticated = await page.evaluate(() => {
        // Check localStorage or sessionStorage for auth state
        const authState = localStorage.getItem("auth") || sessionStorage.getItem("auth")
        return !!authState
      })

      if (isAuthenticated) {
        // Already logged in, just verify
        return
      }

      // Perform login via API first to get tokens
      const loginResponse = await page.request.post(`${apiURL}/auth/login`, {
        data: { email, password },
      })

      if (!loginResponse.ok()) {
        throw new Error(`Login failed: ${loginResponse.statusText()}`)
      }

      const loginData = await loginResponse.json()

      // Set tokens in browser storage
      await page.evaluate(
        ({ accessToken, refreshToken }) => {
          localStorage.setItem("accessToken", accessToken)
          localStorage.setItem("refreshToken", refreshToken)
          // Trigger auth state update if needed
          window.dispatchEvent(new Event("storage"))
        },
        {
          accessToken: loginData.accessToken,
          refreshToken: loginData.refreshToken,
        }
      )

      // Reload page to apply auth state
      await page.reload()
      await page.waitForLoadState("networkidle")

      // Verify we're logged in
      await expect(page).toHaveURL(/^(?!.*login).*$/)
    }

    await use(loginAs)
  },

  logout: async ({ page }, use) => {
    const logout = async () => {
      // Clear auth state
      await page.evaluate(() => {
        localStorage.removeItem("accessToken")
        localStorage.removeItem("refreshToken")
        localStorage.removeItem("auth")
        sessionStorage.removeItem("auth")
        window.dispatchEvent(new Event("storage"))
      })

      // Reload to reflect logout
      await page.reload()
      await page.waitForLoadState("networkidle")
    }

    await use(logout)
  },

  authenticatedPage: async ({ page, loginAs }, use) => {
    // Default test user - can be overridden
    const testEmail = process.env.TEST_USER_EMAIL || "test@example.com"
    const testPassword = process.env.TEST_USER_PASSWORD || "testpassword"

    await loginAs(testEmail, testPassword)
    await use(page)
  },
})

export { expect }
