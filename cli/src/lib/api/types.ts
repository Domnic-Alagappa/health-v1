/**
 * API Types
 * Type definitions for API requests and responses
 */

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface ApiResponse<T> {
  data?: T
  error?: ApiError
  message?: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: User
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface User {
  id: string
  email: string
  username?: string
  role: string
  permissions: string[]
  createdAt?: string
}

export interface UserInfo {
  sub: string
  email: string
  name?: string
  role?: string
  permissions?: string[]
}

export interface Patient {
  id: string
  patientId: string
  firstName: string
  lastName: string
  ssn?: string
  dateOfBirth: string
  email?: string
  phone?: string
  createdAt: string
  createdBy: string
}

export interface AuditEntry {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  timestamp: string
  details?: Record<string, unknown>
  masked: boolean
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

export interface RequestConfig {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
  signal?: AbortSignal
}
