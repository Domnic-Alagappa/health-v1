/**
 * API Test Fixtures
 * API client for direct auth-service integration testing
 */

import type { APIRequestContext } from "@playwright/test"
import { test as base } from "@playwright/test"

type ApiFixtures = {
  apiContext: APIRequestContext
  apiURL: string
  authenticatedApiContext: APIRequestContext
}

export const test = base.extend<ApiFixtures>({
  apiURL: async ({}, use) => {
    const apiURL = process.env.PLAYWRIGHT_API_URL || "http://localhost:8080"
    await use(apiURL)
  },

  apiContext: async ({ apiURL }, use) => {
    const context = await base.request.newContext({
      baseURL: apiURL,
      extraHTTPHeaders: {
        "Content-Type": "application/json",
      },
    })

    await use(context)
    await context.dispose()
  },

  authenticatedApiContext: async ({ apiURL }, use) => {
    const context = await base.request.newContext({
      baseURL: apiURL,
      extraHTTPHeaders: {
        "Content-Type": "application/json",
      },
    })

    // Login to get access token
    const testEmail = process.env.TEST_USER_EMAIL || "test@example.com"
    const testPassword = process.env.TEST_USER_PASSWORD || "testpassword"

    const loginResponse = await context.post("/auth/login", {
      data: { email: testEmail, password: testPassword },
    })

    if (!loginResponse.ok()) {
      throw new Error(`Failed to authenticate API context: ${loginResponse.statusText()}`)
    }

    const loginData = await loginResponse.json()
    const accessToken = loginData.accessToken

    // Update context with auth token
    const authenticatedContext = await base.request.newContext({
      baseURL: apiURL,
      extraHTTPHeaders: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })

    await use(authenticatedContext)
    await authenticatedContext.dispose()
    await context.dispose()
  },
})
