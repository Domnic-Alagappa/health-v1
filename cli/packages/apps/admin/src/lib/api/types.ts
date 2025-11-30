/**
 * API Types
 * Re-export from shared package
 */

export type {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  SetupRequest,
  SetupStatusResponse,
  ServiceInfo,
  ServiceStatusResponse,
  ApiError,
  ApiResponse,
} from "@health-v1/shared/api/types";

export type { UserInfo } from "@health-v1/shared/types/user";

// Note: Admin app uses snake_case for LoginResponse, but shared uses camelCase
// This is a compatibility layer - consider migrating admin to camelCase
export interface LoginResponseSnakeCase {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

import type { UserInfo } from "@health-v1/shared/types/user";

// Admin-specific UserInfo with organization_id
export interface UserInfoWithOrg extends Omit<UserInfo, "sub"> {
  id: string;
  username: string;
  organization_id?: string;
}
