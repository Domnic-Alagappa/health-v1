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
 */
export async function logout(refreshToken: string): Promise<void> {
  await apiRequest(API_ROUTES.AUTH.LOGOUT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${refreshToken}`,
    },
  });
}

/**
 * Refresh token
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
 */
export async function getUserInfo(accessToken: string): Promise<UserInfo> {
  return apiRequest<UserInfo>(API_ROUTES.AUTH.USERINFO, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
