/**
 * API Types
 */

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface UserInfo {
  id: string
  email: string
  username: string
  role: string
  permissions: string[]
  organization_id?: string
}

export interface SetupRequest {
  organization_name: string
  organization_slug: string
  organization_domain?: string
  admin_email: string
  admin_username: string
  admin_password: string
}

export interface SetupStatusResponse {
  setup_completed: boolean
  setup_completed_at?: string
  setup_completed_by?: string
}

export interface ServiceInfo {
  name: string
  enabled: boolean
  operational: boolean
  healthEndpoint?: string
  lastChecked?: string
  error?: string
}

export interface ServiceStatusResponse {
  services: ServiceInfo[]
  overallStatus: string // "operational", "degraded", "down", "unknown"
  checkedAt: string
}

