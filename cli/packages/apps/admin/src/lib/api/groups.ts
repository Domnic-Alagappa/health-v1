/**
 * Groups API Client
 */

import { apiRequest } from "./client";
import type { ApiResponse } from "./types";

export interface Group {
  id: string;
  name: string;
  description?: string;
  organization_id?: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
  organization_id?: string;
}

export interface UpdateGroupRequest {
  name?: string;
  description?: string;
  organization_id?: string;
}

/**
 * List all groups
 */
export async function listGroups(): Promise<ApiResponse<{ groups: Group[] }>> {
  return apiRequest("/api/admin/groups");
}

/**
 * Get group by ID
 */
export async function getGroup(groupId: string): Promise<Group> {
  const response = await apiRequest<Group>(`/api/admin/groups/${groupId}`);
  return response;
}

/**
 * Create a new group
 */
export async function createGroup(
  request: CreateGroupRequest
): Promise<Group> {
  return apiRequest<Group>("/api/admin/groups", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Update a group
 */
export async function updateGroup(
  groupId: string,
  request: UpdateGroupRequest
): Promise<Group> {
  return apiRequest<Group>(`/api/admin/groups/${groupId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}

/**
 * Delete a group
 */
export async function deleteGroup(groupId: string): Promise<void> {
  await apiRequest(`/api/admin/groups/${groupId}`, {
    method: "DELETE",
  });
}

/**
 * Add user to group
 */
export async function addUserToGroup(
  groupId: string,
  userId: string
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return apiRequest(`/api/admin/groups/${groupId}/users/${userId}`, {
    method: "POST",
  });
}

/**
 * Remove user from group
 */
export async function removeUserFromGroup(
  groupId: string,
  userId: string
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return apiRequest(`/api/admin/groups/${groupId}/users/${userId}`, {
    method: "DELETE",
  });
}

/**
 * Assign role to group
 */
export async function assignRoleToGroup(
  groupId: string,
  roleId: string
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return apiRequest(`/api/admin/groups/${groupId}/roles/${roleId}`, {
    method: "POST",
  });
}

