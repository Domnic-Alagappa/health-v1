/**
 * Consolidated API Types
 * All API request and response types used across the application
 */

import type { User } from "../types/user"

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  message?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserInfo {
  sub: string;
  email: string;
  name?: string;
  role?: string;
  permissions?: string[];
}

// Setup types
export interface SetupRequest {
  organization_name: string;
  organization_slug: string;
  organization_domain?: string;
  admin_email: string;
  admin_username: string;
  admin_password: string;
}

export interface SetupStatusResponse {
  setup_completed: boolean;
  setup_completed_at?: string;
  setup_completed_by?: string;
}

// Service types
export interface ServiceInfo {
  name: string;
  enabled: boolean;
  operational: boolean;
  healthEndpoint?: string;
  lastChecked?: string;
  error?: string;
}

export interface ServiceStatusResponse {
  services: ServiceInfo[];
  overallStatus: string; // "operational", "degraded", "down", "unknown"
  checkedAt: string;
}
