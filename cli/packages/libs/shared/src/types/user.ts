/**
 * User-related types
 */

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
  organization_id?: string
}

