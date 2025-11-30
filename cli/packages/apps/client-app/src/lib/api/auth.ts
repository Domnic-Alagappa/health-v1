/**
 * Auth API
 * Authentication-related API calls
 */

import { API_ROUTES } from "@health-v1/shared/api/routes"
import { OIDC_CONFIG } from "@health-v1/shared/constants/oidc"
import { apiClient } from "./client"
import type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UserInfo,
} from "./types"

/**
 * Login with email and password
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>(API_ROUTES.AUTH.LOGIN, credentials)

  if (response.error) {
    throw new Error(response.error.message)
  }

  if (!response.data) {
    throw new Error("No data returned from login")
  }

  // Set tokens in API client
  apiClient.setAuthTokens(response.data.accessToken, response.data.refreshToken)

  return response.data
}

/**
 * Logout - clears tokens
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post(API_ROUTES.AUTH.LOGOUT)
  } finally {
    // Always clear tokens, even if API call fails
    apiClient.setAuthTokens(null, null)
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshTokenResponse> {
  const response = await apiClient.post<RefreshTokenResponse>(API_ROUTES.AUTH.REFRESH, {
    refreshToken,
  } as RefreshTokenRequest)

  if (response.error) {
    throw new Error(response.error.message)
  }

  if (!response.data) {
    throw new Error("No data returned from token refresh")
  }

  // Update tokens in API client
  apiClient.setAuthTokens(response.data.accessToken, response.data.refreshToken)

  return response.data
}

/**
 * Get user info from OIDC userinfo endpoint
 */
export async function getUserInfo(): Promise<UserInfo> {
  const response = await apiClient.get<UserInfo>(API_ROUTES.AUTH.USERINFO)

  if (response.error) {
    throw new Error(response.error.message)
  }

  if (!response.data) {
    throw new Error("No data returned from userinfo")
  }

  return response.data
}

/**
 * OIDC Discovery - get OIDC configuration
 */
export async function discoverOidcConfig(): Promise<unknown> {
  const discoveryUrl = `${OIDC_CONFIG.ISSUER}${OIDC_CONFIG.DISCOVERY_ENDPOINT}`
  const response = await fetch(discoveryUrl)

  if (!response.ok) {
    throw new Error("Failed to discover OIDC configuration")
  }

  return response.json()
}
