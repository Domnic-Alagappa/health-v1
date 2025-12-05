/**
 * Encryption API Client
 * Handles DEK and master key management
 */

import { apiRequest } from "./client";
import type { ApiResponse } from "./types";

export interface DekStatus {
  user_id: string;
  user_email?: string;
  dek_exists: boolean;
  dek_created_at?: string;
  dek_rotated_at?: string;
  rotation_count?: number;
  is_active: boolean;
}

export interface MasterKeyStatus {
  exists: boolean;
  created_at?: string;
  last_rotated_at?: string;
  rotation_count?: number;
}

export interface RotateDekRequest {
  user_id: string;
  reason?: string;
}

export interface RotateDekResponse {
  success: boolean;
  message: string;
  new_dek_id?: string;
}

export interface RotateMasterKeyResponse {
  success: boolean;
  message: string;
  rotation_id?: string;
}

export interface EncryptionStats {
  total_users: number;
  users_with_dek: number;
  users_without_dek: number;
  master_key_exists: boolean;
  master_key_rotation_count: number;
  total_dek_rotations: number;
}

/**
 * Get DEK status for a user
 */
export async function getDekStatus(userId: string): Promise<DekStatus> {
  return apiRequest<DekStatus>(`/api/admin/encryption/deks/${userId}/status`);
}

/**
 * List all DEK statuses
 */
export async function listDekStatuses(): Promise<ApiResponse<{ deks: DekStatus[] }>> {
  return apiRequest("/api/admin/encryption/deks");
}

/**
 * Rotate user DEK
 */
export async function rotateUserDek(
  request: RotateDekRequest
): Promise<RotateDekResponse> {
  return apiRequest<RotateDekResponse>("/api/admin/encryption/deks/rotate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

/**
 * Get master key status
 */
export async function getMasterKeyStatus(): Promise<MasterKeyStatus> {
  return apiRequest<MasterKeyStatus>("/api/admin/encryption/master-key/status");
}

/**
 * Rotate master key
 */
export async function rotateMasterKey(): Promise<RotateMasterKeyResponse> {
  return apiRequest<RotateMasterKeyResponse>("/api/admin/encryption/master-key/rotate", {
    method: "POST",
  });
}

/**
 * Get encryption statistics
 */
export async function getEncryptionStats(): Promise<EncryptionStats> {
  return apiRequest<EncryptionStats>("/api/admin/encryption/stats");
}

