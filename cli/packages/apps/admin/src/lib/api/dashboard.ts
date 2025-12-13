/**
 * Dashboard API
 */

import { API_ROUTES, apiRequest } from "./client";

export interface DashboardStatsResponse {
  organizations_count: number;
  users_count: number;
  permissions_count: number;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStatsResponse> {
  return apiRequest<DashboardStatsResponse>(API_ROUTES.ADMIN.DASHBOARD.STATS, {
    method: "GET",
  });
}

