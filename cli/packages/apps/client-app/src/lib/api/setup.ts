/**
 * Setup API
 * Initial setup-related API calls
 */

import { apiClient } from "./client"
import type { ApiResponse } from "./types"

export interface SetupStatusResponse {
  setup_completed: boolean
}

export interface SetupRequest {
  organization_name: string
  organization_slug: string
  organization_domain?: string
  admin_email: string
  admin_username: string
  admin_password: string
}

export interface SetupResponse {
  success: boolean
  message: string
  organization_id: string
  admin_user_id: string
}

/**
 * Check if setup has been completed
 */
export async function checkSetupStatus(): Promise<SetupStatusResponse> {
  const response = await apiClient.get<SetupStatusResponse>("/api/setup/status")

  if (response.error) {
    throw new Error(response.error.message)
  }

  if (!response.data) {
    throw new Error("No data returned from setup status check")
  }

  return response.data
}

/**
 * Initialize the system (one-time setup)
 */
export async function initializeSetup(request: SetupRequest): Promise<SetupResponse> {
  const response = await apiClient.post<SetupResponse>("/api/setup/initialize", request)

  if (response.error) {
    throw new Error(response.error.message)
  }

  if (!response.data) {
    throw new Error("No data returned from setup initialization")
  }

  return response.data
}

