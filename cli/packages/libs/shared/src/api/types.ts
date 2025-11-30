/**
 * Shared API Types
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

