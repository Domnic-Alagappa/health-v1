/**
 * useMasking Hook Tests
 */

import { maskEmail, maskPhone, maskSSN } from "@/lib/api/masking";
import { useAuthStore } from "@/stores/authStore";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useMasking } from "./useMasking";

describe("useMasking", () => {
  beforeEach(() => {
    useAuthStore.setState({
      role: "doctor",
    });
  });

  it("should mask SSN based on user role", () => {
    const { result } = renderHook(() => useMasking());
    const ssn = "123-45-6789";

    const masked = result.current.mask(ssn, "ssn");
    expect(masked).not.toBe(ssn);
    expect(masked).toContain("6789"); // Last 4 digits visible for doctor
  });

  it("should mask email based on user role", () => {
    const { result } = renderHook(() => useMasking());
    const email = "john.doe@example.com";

    const masked = result.current.mask(email, "email");
    expect(masked).not.toBe(email);
    expect(masked).toContain("@example.com");
  });

  it("should mask phone based on user role", () => {
    const { result } = renderHook(() => useMasking());
    const phone = "123-456-7890";

    const masked = result.current.mask(phone, "phone");
    expect(masked).not.toBe(phone);
    expect(masked).toContain("7890");
  });

  it("should apply complete masking for receptionist role", () => {
    useAuthStore.setState({ role: "receptionist" });
    const { result } = renderHook(() => useMasking());
    const ssn = "123-45-6789";

    const masked = result.current.mask(ssn, "ssn");
    expect(masked).toBe("[REDACTED]");
  });

  it("should handle unknown field types", () => {
    const { result } = renderHook(() => useMasking());
    const value = "some-sensitive-data";

    const masked = result.current.mask(value, "unknown");
    expect(masked).not.toBe(value);
  });

  it("should return user role", () => {
    useAuthStore.setState({ role: "doctor" });
    const { result } = renderHook(() => useMasking());

    expect(result.current.userRole).toBe("doctor");
  });
});
