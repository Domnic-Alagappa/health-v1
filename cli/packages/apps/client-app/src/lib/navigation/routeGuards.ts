/**
 * Route Guards
 * Utilities for protecting routes based on permissions
 */

import { logAccessDenied as logAccessDeniedAPI } from "@/lib/api/audit";
import { useAuthStore } from "@/stores/authStore";
import type { Permission } from "@health-v1/shared/constants/permissions";

export interface RouteGuardConfig {
  requiredPermission: Permission;
  resource?: string;
  redirectTo?: string;
}

/**
 * Check if user has permission to access a route
 */
export function checkRoutePermission(
  hasPermission: (perm: Permission) => boolean,
  config: RouteGuardConfig
): { allowed: boolean; reason?: string } {
  const { requiredPermission, resource } = config;

  if (!hasPermission(requiredPermission)) {
    // Log access denied
    if (resource) {
      const state = useAuthStore.getState();
      if (state.user) {
        logAccessDeniedAPI(state.user.id, resource, requiredPermission, state.user.role);
      }
    }

    return {
      allowed: false,
      reason: `Missing required permission: ${requiredPermission}`,
    };
  }

  return { allowed: true };
}

/**
 * Create a route guard function
 */
export function createRouteGuard(hasPermission: (perm: Permission) => boolean) {
  return (config: RouteGuardConfig) => checkRoutePermission(hasPermission, config);
}
