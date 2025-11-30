/**
 * PermissionGate Component
 * Fine-grained permission checking with AND/OR logic
 */

import { Box } from "@/components/ui/box"
import { useAuditLog } from "@/hooks/security/useAuditLog"
import { usePermissions } from "@/hooks/security/usePermissions"
import type { Permission } from "@/lib/constants/permissions"
import { AccessDenied } from "./AccessDenied"

interface PermissionGateProps {
  children: React.ReactNode
  permissions: Permission[]
  mode?: "all" | "any" // 'all' = AND logic, 'any' = OR logic
  fallback?: React.ReactNode
  resource?: string
}

export function PermissionGate({
  children,
  permissions,
  mode = "all",
  fallback,
  resource,
}: PermissionGateProps) {
  const { hasAllPermissions, hasAnyPermission } = usePermissions()
  const { logDenied } = useAuditLog()

  const granted = mode === "all" ? hasAllPermissions(permissions) : hasAnyPermission(permissions)

  if (!granted) {
    // Log access denied
    if (resource) {
      logDenied(resource, permissions.join(mode === "all" ? " AND " : " OR "))
    }

    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <AccessDenied
        type="component"
        resource={resource || "resource"}
        requiredPermissions={permissions}
      />
    )
  }

  return <Box>{children}</Box>
}
