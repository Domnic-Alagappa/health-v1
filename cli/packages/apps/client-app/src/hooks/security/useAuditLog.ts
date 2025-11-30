/**
 * useAuditLog Hook
 * Hook for audit logging and immutable audit trail access
 */

import { logAccessDenied, logPHIAccess, logPermissionCheck, logStateChange } from "@/lib/api/audit";
import type { AuditEntry } from "@/lib/api/types";
import { useAuditStore } from "@/stores/auditStore";
import { useAuth } from "@/stores/authStore";
import { useCallback } from "react";

export function useAuditLog() {
  const { user } = useAuth();
  const { addEntry, getEntriesByUser, getEntriesByResource, exportEntries } = useAuditStore();

  const logPHI = useCallback(
    (resource: string, resourceId?: string, details?: Record<string, unknown>) => {
      if (!user) return;

      // Add to local store
      addEntry({
        userId: user.id,
        action: "PHI_ACCESS",
        resource,
        resourceId,
        details,
      });

      // Also log via API
      logPHIAccess(user.id, resource, resourceId, details);
    },
    [user, addEntry]
  );

  const logState = useCallback(
    (action: string, resource: string, resourceId?: string, details?: Record<string, unknown>) => {
      if (!user) return;

      addEntry({
        userId: user.id,
        action: `STATE_CHANGE:${action}`,
        resource,
        resourceId,
        details,
      });

      logStateChange(user.id, resource, action, resourceId, details);
    },
    [user, addEntry]
  );

  const logPermission = useCallback(
    (permission: string, granted: boolean, resource?: string) => {
      if (!user) return;

      addEntry({
        userId: user.id,
        action: "PERMISSION_CHECK",
        resource: resource || "system",
        details: {
          permission,
          granted,
        },
      });

      logPermissionCheck(user.id, permission, granted, resource);
    },
    [user, addEntry]
  );

  const logDenied = useCallback(
    (resource: string, requiredPermission: string) => {
      if (!user) return;

      addEntry({
        userId: user.id,
        action: "ACCESS_DENIED",
        resource,
        details: {
          requiredPermission,
          userRole: user.role,
        },
      });

      logAccessDenied(user.id, resource, requiredPermission, user.role);
    },
    [user, addEntry]
  );

  const getUserEntries = useCallback(
    (userId: string): readonly AuditEntry[] => {
      return getEntriesByUser(userId);
    },
    [getEntriesByUser]
  );

  const getResourceEntries = useCallback(
    (resource: string): readonly AuditEntry[] => {
      return getEntriesByResource(resource);
    },
    [getEntriesByResource]
  );

  const exportAuditLog = useCallback(
    (masked = true): AuditEntry[] => {
      return exportEntries(masked);
    },
    [exportEntries]
  );

  return {
    logPHI,
    logState,
    logPermission,
    logDenied,
    getUserEntries,
    getResourceEntries,
    exportAuditLog,
  };
}
