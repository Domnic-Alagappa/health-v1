/**
 * Navigation Utilities
 * Helper functions for navigation with security
 */

import type { Permission } from "@/lib/constants/permissions"
import { canAccessRoute } from "./permissionChecks"

/**
 * Filter navigation items based on permissions
 */
export function filterNavigationItems<T extends { path: string; permission?: Permission }>(
  items: T[],
  hasPermission: (perm: Permission) => boolean
): T[] {
  return items.filter((item) => {
    // If item has explicit permission, check it
    if (item.permission) {
      return hasPermission(item.permission)
    }

    // Otherwise, check route permission
    return canAccessRoute(item.path, hasPermission)
  })
}

/**
 * Check if navigation should be hidden
 */
export function shouldHideNavigation(
  path: string,
  hasPermission: (perm: Permission) => boolean
): boolean {
  return !canAccessRoute(path, hasPermission)
}
