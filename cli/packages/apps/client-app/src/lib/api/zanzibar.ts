/**
 * Zanzibar API Client
 * Relationship-based permission checking and management
 */

import { API_ROUTES } from "@health-v1/shared/api/routes";
import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export interface RelationshipTuple {
  user: string;
  relation: string;
  object: string;
}

export interface CheckPermissionRequest {
  userId: string;
  relation: string;
  resourceId: string;
}

export interface CheckPermissionResponse {
  granted: boolean;
}

export interface BatchCheckRequest {
  checks: Array<{
    userId: string;
    relation: string;
    resourceId: string;
  }>;
}

export interface BatchCheckResponse {
  results: boolean[];
}

export interface CreateRelationshipRequest {
  userId: string;
  relation: string;
  resourceId: string;
}

export interface Relationship {
  id: string;
  user: string;
  relation: string;
  object: string;
  createdAt: string;
}

export interface ListRelationshipsResponse {
  relationships: Relationship[];
}

/**
 * Check if a user has a specific permission on a resource
 */
export async function checkPermission(
  userId: string,
  relation: string,
  resourceId: string
): Promise<boolean> {
  const response = await apiClient.post<CheckPermissionResponse>(API_ROUTES.ADMIN.RELATIONSHIPS.CHECK, {
    userId,
    relation,
    resourceId,
  } as CheckPermissionRequest);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.granted ?? false;
}

/**
 * Batch check multiple permissions
 */
export async function batchCheckPermissions(
  checks: Array<{ userId: string; relation: string; resourceId: string }>
): Promise<boolean[]> {
  const response = await apiClient.post<BatchCheckResponse>(API_ROUTES.ADMIN.RELATIONSHIPS.BATCH_CHECK, {
    checks,
  } as BatchCheckRequest);

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.results ?? [];
}

/**
 * Get all relationships for a user
 */
export async function getUserRelationships(userId: string): Promise<Relationship[]> {
  const response = await apiClient.get<ListRelationshipsResponse>(API_ROUTES.ADMIN.RELATIONSHIPS.USER(userId));

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data?.relationships ?? [];
}

/**
 * Create a new relationship
 */
export async function createRelationship(
  userId: string,
  relation: string,
  resourceId: string
): Promise<Relationship> {
  const response = await apiClient.post<Relationship>(API_ROUTES.ADMIN.RELATIONSHIPS.CREATE, {
    userId,
    relation,
    resourceId,
  } as CreateRelationshipRequest);

  if (response.error) {
    throw new Error(response.error.message);
  }

  if (!response.data) {
    throw new Error("No data returned from create relationship");
  }

  return response.data;
}

/**
 * Delete a relationship
 */
export async function deleteRelationship(relationshipId: string): Promise<void> {
  const response = await apiClient.delete(API_ROUTES.ADMIN.RELATIONSHIPS.DELETE(relationshipId));

  if (response.error) {
    throw new Error(response.error.message);
  }
}
