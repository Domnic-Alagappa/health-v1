/**
 * useMasking Hook
 * Hook for contextual masking based on user role
 */

import { useCallback } from "react"
import {
  contextualMask,
  type MaskingLevel,
  maskCreditCard,
  maskEmail,
  maskMRN,
  maskPhone,
  maskSSN,
} from "@/lib/api/masking"
import { SECURITY_CONFIG } from "@health-v1/shared/constants/security"
import { useAuth } from "@/stores/authStore"

/**
 * Get masking level for a specific field and role
 */
function getMaskingLevel(field: string, userRole: string): MaskingLevel {
  switch (userRole.toLowerCase()) {
    case "admin":
      return "partial"
    case "doctor":
      return "partial"
    case "nurse":
      return "partial"
    case "receptionist":
      return "complete"
    default:
      return "complete"
  }
}

export function useMasking() {
  const { role } = useAuth()
  const userRole = role || "receptionist" // Default to most restrictive

  const mask = useCallback(
    (value: string, field: string, level?: MaskingLevel) => {
      if (!value) return ""

      // Use provided level or get contextual level
      const maskingLevel = level || getMaskingLevel(field, userRole)

      switch (field.toLowerCase()) {
        case "ssn":
          return maskSSN(value, maskingLevel)
        case "email":
          return maskEmail(value, maskingLevel)
        case "phone":
          return maskPhone(value, maskingLevel)
        case "mrn":
          return maskMRN(value, maskingLevel)
        case "creditcard":
        case "credit_card":
          return maskCreditCard(value)
        default:
          return contextualMask(value, field, userRole)
      }
    },
    [userRole]
  )

  return {
    mask,
    userRole,
  }
}
