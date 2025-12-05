/**
 * Authentication API
 */

import { API_ROUTES, apiRequest } from "./client";
import type { LoginRequest, LoginResponse, UserInfo } from "./types";

/**
 * Login
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(API_ROUTES.AUTH.LOGIN, {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

/**
 * Logout
 * Session-based: No token needed, session is in cookie
 */
export async function logout(): Promise<void> {
  await apiRequest(API_ROUTES.AUTH.LOGOUT, {
    method: "POST",
  });
}

/**
 * Refresh token (for mobile/API clients only)
 * Not used in session-based web UI
 */
export async function refreshToken(refreshToken: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>(API_ROUTES.AUTH.REFRESH, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });
}

/**
 * Get user info
 * Session-based: No token needed, session is in cookie
 */
export async function getUserInfo(): Promise<UserInfo> {
  return apiRequest<UserInfo>(API_ROUTES.AUTH.USERINFO, {
    method: "GET",
  });
}
