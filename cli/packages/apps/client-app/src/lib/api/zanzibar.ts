/**
 * Zanzibar API Client
 * Relationship-based permission checking and management
 */

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
  const response = await apiClient.post<CheckPermissionResponse>("/relationships/check", {
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
  const response = await apiClient.post<BatchCheckResponse>("/relationships/batch-check", {
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
  const response = await apiClient.get<ListRelationshipsResponse>(`/relationships/user/${userId}`);

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
  const response = await apiClient.post<Relationship>("/relationships", {
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
  const response = await apiClient.delete(`/relationships/${relationshipId}`);

  if (response.error) {
    throw new Error(response.error.message);
  }
}
