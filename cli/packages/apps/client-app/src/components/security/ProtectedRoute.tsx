/**
 * ProtectedRoute Component
 * Route-level permission checking and redirects
 */

import { Box } from "@/components/ui/box";
import { useAuditLog } from "@/hooks/security/useAuditLog";
import { usePermissions } from "@/hooks/security/usePermissions";
import type { Permission } from "@health-v1/shared/constants/permissions";
import { Navigate } from "@tanstack/react-router";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission: Permission;
  redirectTo?: string;
  resource?: string;
}

export function ProtectedRoute({
  children,
  requiredPermission,
  redirectTo = "/access-denied",
  resource,
}: ProtectedRouteProps) {
  const { hasPermission } = usePermissions();
  const { logDenied } = useAuditLog();
  const granted = hasPermission(requiredPermission);

  if (!granted) {
    // Log access denied
    if (resource) {
      logDenied(resource, requiredPermission);
    }

    // For route-level, we can either redirect or show access denied
    // Using Navigate for cleaner UX
    return <Navigate to={redirectTo as "/"} />;
  }

  return <Box>{children}</Box>;
}
