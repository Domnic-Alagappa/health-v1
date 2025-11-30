/**
 * API Types
 * Re-export from shared package
 */

export type {
  ApiError,
  ApiResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  UserInfo,
  ServiceInfo,
  ServiceStatusResponse,
  SetupRequest,
  SetupStatusResponse,
} from "@health-v1/shared/api/types"

export type { User } from "@health-v1/shared/types/user"
export type { Patient } from "@health-v1/shared/types/patient"
export type { AuditEntry } from "@health-v1/shared/types/audit"
export type { HttpMethod, RequestConfig } from "@health-v1/shared/types/common"
