/**
 * Permission Checks
 * Utilities for checking permissions in navigation
 */

import type { Permission } from "@health-v1/shared/constants/permissions"
import { PERMISSIONS } from "@health-v1/shared/constants/permissions"

/**
 * Get required permission for a route
 */
export function getRoutePermission(route: string): Permission | null {
  // Map routes to permissions
  const routePermissionMap: Record<string, Permission> = {
    "/patients": PERMISSIONS.PATIENTS.VIEW,
    "/patients/:id": PERMISSIONS.PATIENTS.VIEW,
    "/clinical": PERMISSIONS.CLINICAL.VIEW,
    "/orders": PERMISSIONS.ORDERS.VIEW,
    "/results": PERMISSIONS.RESULTS.VIEW,
    "/pharmacy": PERMISSIONS.PHARMACY.VIEW,
    "/scheduling": PERMISSIONS.SCHEDULING.VIEW,
    "/revenue": PERMISSIONS.REVENUE.VIEW,
    "/analytics": PERMISSIONS.ANALYTICS.VIEW,
    "/settings": PERMISSIONS.SETTINGS.VIEW,
  }

  // Try exact match first
  if (routePermissionMap[route]) {
    return routePermissionMap[route]
  }

  // Try pattern matching (e.g., /patients/:id)
  for (const [pattern, permission] of Object.entries(routePermissionMap)) {
    const patternRegex = new RegExp("^" + pattern.replace(/:\w+/g, "[^/]+") + "$")
    if (patternRegex.test(route)) {
      return permission
    }
  }

  return null
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(
  route: string,
  hasPermission: (perm: Permission) => boolean
): boolean {
  const requiredPermission = getRoutePermission(route)

  if (!requiredPermission) {
    // No permission required, allow access
    return true
  }

  return hasPermission(requiredPermission)
}
