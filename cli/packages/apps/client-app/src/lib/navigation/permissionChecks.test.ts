/**
 * Permission Checks Tests
 */

import { describe, expect, it } from "vitest"
import { PERMISSIONS } from "@health-v1/shared/constants/permissions"
import { canAccessRoute, getRoutePermission } from "./permissionChecks"

describe("Permission Checks", () => {
  const mockPermissions = [
    PERMISSIONS.PATIENTS.VIEW,
    PERMISSIONS.PATIENTS.EDIT,
    PERMISSIONS.CLINICAL.VIEW,
  ]

  const hasPermission = (perm: string) => mockPermissions.includes(perm as any)

  describe("getRoutePermission", () => {
    it("should return permission for /patients route", () => {
      const permission = getRoutePermission("/patients")
      expect(permission).toBe(PERMISSIONS.PATIENTS.VIEW)
    })

    it("should return permission for /clinical route", () => {
      const permission = getRoutePermission("/clinical")
      expect(permission).toBe(PERMISSIONS.CLINICAL.VIEW)
    })

    it("should return null for dashboard route", () => {
      const permission = getRoutePermission("/")
      expect(permission).toBeNull()
    })

    it("should return null for unknown route", () => {
      const permission = getRoutePermission("/unknown")
      expect(permission).toBeNull()
    })

    it("should match pattern routes like /patients/:id", () => {
      const permission = getRoutePermission("/patients/123")
      expect(permission).toBe(PERMISSIONS.PATIENTS.VIEW)
    })
  })

  describe("canAccessRoute", () => {
    it("should allow access when user has permission", () => {
      const result = canAccessRoute("/patients", hasPermission)
      expect(result).toBe(true)
    })

    it("should deny access when user lacks permission", () => {
      const result = canAccessRoute("/orders", hasPermission)
      expect(result).toBe(false)
    })

    it("should allow access to dashboard without permission", () => {
      const result = canAccessRoute("/", hasPermission)
      expect(result).toBe(true)
    })

    it("should allow access to routes with no permission requirement", () => {
      const result = canAccessRoute("/unknown", hasPermission)
      expect(result).toBe(true)
    })
  })
})
