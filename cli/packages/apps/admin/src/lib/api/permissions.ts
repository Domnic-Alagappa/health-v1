/**
 * Permission API Client
 * Handles all permission-related API calls for Zanzibar-based access control
 */

import { API_ROUTES, apiRequest } from "./client";
import type { ApiResponse } from "./types";

export interface CheckPermissionRequest {
  user: string; // user:{id} or just user ID
  relation: string;
  object: string;
}

export interface CheckPermissionResponse {
  allowed: boolean;
}

export interface BatchCheckPermissionRequest {
  checks: Array<[string, string, string]>; // (user, relation, object)
}

export interface BatchCheckPermissionResponse {
  results: boolean[];
}

export interface UserPermissionsResponse {
  user_id: string;
  permissions: PermissionInfo[];
}

export interface PermissionInfo {
  relation: string;
  object: string;
}

export interface UserPagesResponse {
  user_id: string;
  pages: string[];
}

export interface UserButtonsResponse {
  user_id: string;
  page: string;
  buttons: string[];
}

export interface UserFieldsResponse {
  user_id: string;
  page: string;
  view_fields: string[];
  edit_fields: string[];
}

export interface AssignPermissionRequest {
  subject: string; // user:{id}, role:{name}, or group:{id}
  relation: string;
  object: string;
  expires_at?: string; // ISO 8601 date string
  valid_from?: string; // ISO 8601 date string
  metadata?: Record<string, unknown>;
}

export interface BatchAssignPermissionRequest {
  assignments: AssignPermissionRequest[];
}

export interface RevokePermissionRequest {
  subject: string;
  relation: string;
  object: string;
}

/**
 * Check if a user has a specific permission
 */
export async function checkPermission(
  userId: string,
  relation: string,
  object: string
): Promise<CheckPermissionResponse> {
  return apiRequest<CheckPermissionResponse>(API_ROUTES.ADMIN.PERMISSIONS.CHECK, {
    method: "POST",
    body: JSON.stringify({
      user: userId,
      relation,
      object,
    }),
  });
}

/**
 * Batch check multiple permissions
 */
export async function checkPermissionsBatch(
  checks: Array<[string, string, string]>
): Promise<BatchCheckPermissionResponse> {
  return apiRequest<BatchCheckPermissionResponse>(
    API_ROUTES.ADMIN.PERMISSIONS.CHECK_BATCH,
    {
      method: "POST",
      body: JSON.stringify({ checks }),
    }
  );
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(
  userId: string
): Promise<UserPermissionsResponse> {
  return apiRequest<UserPermissionsResponse>(
    API_ROUTES.ADMIN.PERMISSIONS.USER(userId)
  );
}

/**
 * Get user's accessible pages
 */
export async function getUserPages(userId: string): Promise<UserPagesResponse> {
  return apiRequest<UserPagesResponse>(
    API_ROUTES.ADMIN.PERMISSIONS.USER_PAGES(userId)
  );
}

/**
 * Get user's accessible buttons for a page
 */
export async function getUserButtons(
  userId: string,
  pageName: string
): Promise<UserButtonsResponse> {
  return apiRequest<UserButtonsResponse>(
    API_ROUTES.ADMIN.PERMISSIONS.USER_BUTTONS(userId, pageName)
  );
}

/**
 * Get user's accessible fields for a page
 */
export async function getUserFields(
  userId: string,
  pageName: string
): Promise<UserFieldsResponse> {
  return apiRequest<UserFieldsResponse>(
    API_ROUTES.ADMIN.PERMISSIONS.USER_FIELDS(userId, pageName)
  );
}

/**
 * Assign a permission to a user/role/group
 */
export async function assignPermission(
  request: AssignPermissionRequest
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return apiRequest(API_ROUTES.ADMIN.PERMISSIONS.ASSIGN, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Batch assign permissions
 */
export async function assignPermissionsBatch(
  request: BatchAssignPermissionRequest
): Promise<
  ApiResponse<{
    success: boolean;
    message: string;
    count: number;
    errors?: string[];
  }>
> {
  return apiRequest(API_ROUTES.ADMIN.PERMISSIONS.ASSIGN_BATCH, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Revoke a permission
 */
export async function revokePermission(
  request: RevokePermissionRequest
): Promise<ApiResponse<{ success: boolean; message: string }>> {
  return apiRequest(API_ROUTES.ADMIN.PERMISSIONS.REVOKE, {
    method: "DELETE",
    body: JSON.stringify(request),
  });
}

/**
 * Get all relationships (for admin view)
 * Note: This endpoint may need to be created in the backend
 */
export async function listAllRelationships(): Promise<
  ApiResponse<{
    relationships: Array<{
      id: string;
      user: string;
      relation: string;
      object: string;
      expires_at?: string;
      valid_from?: string;
      is_active: boolean;
    }>;
  }>
> {
  return apiRequest(API_ROUTES.ADMIN.RELATIONSHIPS.LIST);
}

