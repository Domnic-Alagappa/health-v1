/**
 * Dashboard API
 */

import { apiRequest } from "./client";

export interface DashboardStatsResponse {
  organizations_count: number;
  users_count: number;
  permissions_count: number;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  return apiRequest<DashboardStatsResponse>("/api/admin/dashboard/stats", {
    method: "GET",
  });
}

