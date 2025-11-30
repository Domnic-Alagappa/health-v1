/**
 * useImmutableFields Hook Tests
 */

import { renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { useImmutableFields } from "./useImmutableFields"

describe("useImmutableFields", () => {
  it("should check if field is immutable", () => {
    const { result } = renderHook(() => useImmutableFields())

    expect(result.current.isImmutable("patient", "id")).toBe(true)
    expect(result.current.isImmutable("patient", "ssn")).toBe(true)
    expect(result.current.isImmutable("patient", "dateOfBirth")).toBe(true)
    expect(result.current.isImmutable("patient", "firstName")).toBe(false)
  })

  it("should get immutable fields for entity", () => {
    const { result } = renderHook(() => useImmutableFields())

    const immutableFields = result.current.getImmutableFields("patient")
    expect(immutableFields).toContain("id")
    expect(immutableFields).toContain("ssn")
    expect(immutableFields).toContain("dateOfBirth")
    expect(immutableFields).not.toContain("firstName")
  })

  it("should validate immutable field updates", () => {
    const { result } = renderHook(() => useImmutableFields())

    const validation = result.current.validateFieldUpdate("patient", "id", "new-value")
    expect(validation.valid).toBe(false)
    expect(validation.error).toContain("immutable")
  })

  it("should allow updates to non-immutable fields", () => {
    const { result } = renderHook(() => useImmutableFields())

    const validation = result.current.validateFieldUpdate("patient", "firstName", "Jane")
    expect(validation.valid).toBe(true)
    expect(validation.error).toBeUndefined()
  })
})
