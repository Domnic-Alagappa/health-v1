/**
 * Route Guards Tests
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { PERMISSIONS } from "@health-v1/shared/constants/permissions"
import { useAuthStore } from "@/stores/authStore"
import { checkRoutePermission, createRouteGuard } from "./routeGuards"

// Mock audit API
vi.mock("@/lib/api/audit", () => ({
  logAccessDenied: vi.fn(),
}))

describe("Route Guards", () => {
  beforeEach(() => {
    useAuthStore.setState({
      permissions: [PERMISSIONS.PATIENTS.VIEW],
    })
  })

  describe("checkRoutePermission", () => {
    it("should allow access when user has permission", () => {
      const hasPermission = (perm: string) => useAuthStore.getState().permissions.includes(perm)

      const result = checkRoutePermission(hasPermission, {
        requiredPermission: PERMISSIONS.PATIENTS.VIEW,
        resource: "patients",
      })

      expect(result.allowed).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it("should deny access when user lacks permission", () => {
      const hasPermission = (perm: string) => useAuthStore.getState().permissions.includes(perm)

      const result = checkRoutePermission(hasPermission, {
        requiredPermission: PERMISSIONS.PATIENTS.EDIT,
        resource: "patients",
      })

      expect(result.allowed).toBe(false)
      expect(result.reason).toContain("Missing required permission")
    })

    it("should log access denied when resource is provided", () => {
      const { logAccessDenied } = require("@/lib/api/audit")
      const hasPermission = (perm: string) => useAuthStore.getState().permissions.includes(perm)

      checkRoutePermission(hasPermission, {
        requiredPermission: PERMISSIONS.PATIENTS.EDIT,
        resource: "patients",
      })

      expect(logAccessDenied).toHaveBeenCalled()
    })
  })

  describe("createRouteGuard", () => {
    it("should create a route guard function", () => {
      const hasPermission = (perm: string) => useAuthStore.getState().permissions.includes(perm)

      const guard = createRouteGuard(hasPermission)

      const result = guard({
        requiredPermission: PERMISSIONS.PATIENTS.VIEW,
        resource: "patients",
      })

      expect(result.allowed).toBe(true)
    })

    it("should work with different permission checks", () => {
      const hasPermission = (perm: string) => useAuthStore.getState().permissions.includes(perm)

      const guard = createRouteGuard(hasPermission)

      const allowed = guard({
        requiredPermission: PERMISSIONS.PATIENTS.VIEW,
        resource: "patients",
      })

      const denied = guard({
        requiredPermission: PERMISSIONS.CLINICAL.VIEW,
        resource: "clinical",
      })

      expect(allowed.allowed).toBe(true)
      expect(denied.allowed).toBe(false)
    })
  })
})
