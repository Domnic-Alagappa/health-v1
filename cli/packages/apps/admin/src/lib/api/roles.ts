/**
 * Roles API Client
 */

import { apiRequest } from "./client";
import type { ApiResponse } from "./types";

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

export interface AssignRoleRequest {
  user_id: string;
  role_id: string;
}

/**
 * List all roles
 */
export async function listRoles(): Promise<ApiResponse<{ roles: Role[] }> | ApiResponse<Role[]>> {
  return apiRequest("/api/admin/roles");
}

/**
 * Get role by ID
 */
export async function getRole(roleId: string): Promise<ApiResponse<Role>> {
  return apiRequest(`/api/admin/roles/${roleId}`);
}

/**
 * Create a new role
 */
export async function createRole(
  request: CreateRoleRequest
): Promise<ApiResponse<Role>> {
  return apiRequest("/api/admin/roles", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Update a role
 */
export async function updateRole(
  roleId: string,
  request: UpdateRoleRequest
): Promise<ApiResponse<Role>> {
  return apiRequest(`/api/admin/roles/${roleId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: string): Promise<ApiResponse<void>> {
  return apiRequest(`/api/admin/roles/${roleId}`, {
    method: "DELETE",
  });
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(
  request: AssignRoleRequest
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return apiRequest("/api/admin/roles/assign", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

