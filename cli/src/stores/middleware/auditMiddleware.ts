/**
 * Audit Middleware
 * Logs all state changes involving PHI for audit trail
 */

import type { StateCreator } from "zustand"
import { SECURITY_CONFIG } from "@/lib/constants/security"
import { useAuditStore } from "../auditStore"
import { useAuthStore } from "../authStore"

// Fields that contain PHI and should be audited
const PHI_FIELDS = [
  "ssn",
  "email",
  "phone",
  "mrn",
  "patientId",
  "dateOfBirth",
  "address",
  "creditCard",
]

/**
 * Check if an object contains PHI fields
 */
function containsPHI(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false

  const keys = Object.keys(obj)
  return keys.some((key) =>
    PHI_FIELDS.some((phiField) => key.toLowerCase().includes(phiField.toLowerCase()))
  )
}

/**
 * Extract PHI-related changes from state update
 */
function extractPHIChanges(partial: unknown): Record<string, unknown> | null {
  if (!partial || typeof partial !== "object") return null

  const changes: Record<string, unknown> = {}
  let hasPHI = false

  for (const [key, value] of Object.entries(partial)) {
    if (PHI_FIELDS.some((phiField) => key.toLowerCase().includes(phiField.toLowerCase()))) {
      changes[key] = value
      hasPHI = true
    } else if (typeof value === "object" && containsPHI(value)) {
      changes[key] = value
      hasPHI = true
    }
  }

  return hasPHI ? changes : null
}

/**
 * Audit middleware that logs state changes involving PHI
 */
export function auditMiddleware<T>(config: StateCreator<T>): StateCreator<T> {
  return (set, get, api) => {
    if (!SECURITY_CONFIG.AUDIT.LOG_STATE_CHANGES) {
      return config(set, get, api)
    }

    // Wrap set function to log changes
    const setWithAudit = (
      partial: T | Partial<T> | ((state: T) => T | Partial<T>),
      replace?: boolean
    ) => {
      const authState = useAuthStore.getState()
      const auditStore = useAuditStore.getState()

      // Determine what changed
      let changes: Record<string, unknown> | null = null

      if (typeof partial === "function") {
        // For function updates, we can't easily detect changes before applying
        // In a production system, you might use a deep diff library
        const currentState = get()
        const newState = partial(currentState)
        if (typeof newState === "object" && newState !== null) {
          changes = extractPHIChanges(newState)
        }
      } else if (typeof partial === "object" && partial !== null) {
        changes = extractPHIChanges(partial)
      }

      // Log PHI access if changes contain PHI
      if (changes && authState.user) {
        auditStore.logPHIAccess(authState.user.id, "state", undefined, changes)
      }

      // Call original set
      return set(partial, replace)
    }

    return config(setWithAudit, get, api)
  }
}
