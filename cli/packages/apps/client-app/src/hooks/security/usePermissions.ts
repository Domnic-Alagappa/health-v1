/**
 * usePermissions Hook
 * Hook for checking user permissions and roles
 */

import { useAuthStore } from "@/stores/authStore";
import {
  PERMISSIONS,
  type Permission,
  ROLE_PERMISSIONS,
} from "@health-v1/shared/constants/permissions";
import { useCallback, useMemo } from "react";

export function usePermissions() {
  // Use individual selectors to avoid object recreation
  const permissions = useAuthStore((state) => state.permissions);
  const role = useAuthStore((state) => state.role);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.some((perm) => permissions.includes(perm));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.every((perm) => permissions.includes(perm));
    },
    [permissions]
  );

  const hasRole = useCallback(
    (requiredRole: string): boolean => {
      return role === requiredRole;
    },
    [role]
  );

  const hasAnyRole = useCallback(
    (requiredRoles: string[]): boolean => {
      return requiredRoles.includes(role || "");
    },
    [role]
  );

  // Get all permissions for current role
  const rolePermissions = useMemo(() => {
    if (!role) return [];
    return ROLE_PERMISSIONS[role] || [];
  }, [role]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    permissions,
    role,
    rolePermissions,
  };
}
