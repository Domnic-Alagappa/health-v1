/**
 * AccessDenied Component
 * Unified access denied component for all scenarios
 * Supports both health-v1 permissions and vault ACL denials
 */

import { Box } from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Stack } from "@/components/ui/stack";
import { usePermissions } from "@/hooks/security/usePermissions";
import type { Permission } from "@health-v1/shared/constants/permissions";
import { AlertCircle, Lock, Shield } from "lucide-react";

interface AccessDeniedProps {
  type: "route" | "tab" | "component" | "api";
  resource: string;
  requiredPermissions: Permission[];
  currentPermissions?: string[];
  onRequestAccess?: () => void;
  /** Vault path if access was denied due to vault ACL */
  vaultPath?: string;
}

export function AccessDenied({
  type,
  resource,
  requiredPermissions,
  currentPermissions,
  onRequestAccess,
  vaultPath,
}: AccessDeniedProps) {
  const { permissions, role } = usePermissions();
  const displayPermissions = currentPermissions || permissions;

  return (
    <Card className="p-6">
      <Stack spacing="md" align="center">
        <Box className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
          <Lock className="h-6 w-6 text-destructive" />
        </Box>

        <Stack spacing="sm" align="center">
          <h3 className="text-lg font-semibold">Access Denied</h3>
          <p className="text-sm text-muted-foreground text-center">
            You don't have permission to access this{" "}
            {type === "route" ? "page" : type === "tab" ? "tab" : "resource"}.
          </p>
        </Stack>

        <Stack spacing="xs" className="w-full">
          <Box className="text-sm font-medium">Resource:</Box>
          <Box className="text-sm text-muted-foreground">{resource}</Box>
        </Stack>

        <Stack spacing="xs" className="w-full">
          <Box className="text-sm font-medium">Required Permissions:</Box>
          <Stack spacing="xs">
            {requiredPermissions.map((perm) => (
              <Box key={perm} className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span
                  className={
                    displayPermissions.includes(perm) ? "text-muted-foreground line-through" : ""
                  }
                >
                  {perm}
                </span>
              </Box>
            ))}
          </Stack>
        </Stack>

        {vaultPath && (
          <Stack spacing="xs" className="w-full">
            <Box className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Vault Access Required:
            </Box>
            <Box className="text-sm text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
              {vaultPath}
            </Box>
            <Box className="text-xs text-muted-foreground">
              Contact your administrator to update your vault policy.
            </Box>
          </Stack>
        )}

        {role && (
          <Stack spacing="xs" className="w-full">
            <Box className="text-sm font-medium">Your Role:</Box>
            <Box className="text-sm text-muted-foreground">{role}</Box>
          </Stack>
        )}

        {onRequestAccess && (
          <button onClick={onRequestAccess} className="text-sm text-primary hover:underline">
            Request Access
          </button>
        )}
      </Stack>
    </Card>
  );
}
