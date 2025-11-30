/**
 * Access Denied Route
 * Page shown when user doesn't have permission to access a resource
 */

import { createFileRoute } from "@tanstack/react-router"
import { AccessDenied } from "@/components/security/AccessDenied"
import { Container } from "@/components/ui/container"
import { usePermissions } from "@/hooks/security/usePermissions"
import { PERMISSIONS } from "@health-v1/shared/constants/permissions"

export const Route = createFileRoute("/access-denied")({
  component: AccessDeniedPage,
})

function AccessDeniedPage() {
  const { permissions, role } = usePermissions()

  // Get required permission from URL params or default
  const searchParams = new URL(window.location.href).searchParams
  const resource = searchParams.get("resource") || "resource"
  const requiredPermission = searchParams.get("permission") || PERMISSIONS.PATIENTS.VIEW

  return (
    <Container size="lg" className="py-8">
      <AccessDenied
        type="route"
        resource={resource}
        requiredPermissions={[requiredPermission as any]}
        currentPermissions={permissions}
      />
    </Container>
  )
}
