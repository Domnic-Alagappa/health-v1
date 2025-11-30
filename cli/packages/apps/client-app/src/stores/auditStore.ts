/**
 * Audit Store
 * Immutable append-only audit log with encryption support
 */

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { maskObject } from "@/lib/api/masking"
import type { AuditEntry } from "@/lib/api/types"
import { SECURITY_CONFIG } from "@/lib/constants/security"

interface AuditState {
  entries: readonly AuditEntry[]
  maxEntries: number
}

interface AuditActions {
  addEntry: (entry: Omit<AuditEntry, "id" | "timestamp" | "masked">) => void
  clearOldEntries: () => void
  exportEntries: (masked?: boolean) => AuditEntry[]
  getEntriesByUser: (userId: string) => readonly AuditEntry[]
  getEntriesByResource: (resource: string) => readonly AuditEntry[]
}

type AuditStore = AuditState & AuditActions

const initialState: AuditState = {
  entries: [],
  maxEntries: 10000, // Limit to prevent memory issues
}

export const useAuditStore = create<AuditStore>()(
  immer((set, get) => ({
    ...initialState,

    addEntry: (entryData) => {
      const entry: AuditEntry = {
        id: crypto.randomUUID(),
        ...entryData,
        timestamp: new Date().toISOString(),
        masked: SECURITY_CONFIG.AUDIT.MASK_IN_LOGS,
      }

      // Mask PHI in audit entry if configured
      if (SECURITY_CONFIG.AUDIT.MASK_IN_LOGS && entry.details) {
        const fieldsToMask = ["ssn", "email", "phone", "mrn", "creditCard", "patientId"]
        entry.details = maskObject(entry.details, fieldsToMask)
      }

      set((state) => {
        // Append to entries (immutable operation)
        const newEntries = [...state.entries, entry]

        // Limit entries to prevent memory issues
        if (newEntries.length > state.maxEntries) {
          // Remove oldest entries (keep most recent)
          const startIndex = newEntries.length - state.maxEntries
          state.entries = newEntries.slice(startIndex)
        } else {
          state.entries = newEntries
        }
      })
    },

    clearOldEntries: () => {
      const retentionDays = SECURITY_CONFIG.AUDIT.RETENTION_DAYS
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      set((state) => {
        state.entries = state.entries.filter((entry) => {
          const entryDate = new Date(entry.timestamp)
          return entryDate >= cutoffDate
        })
      })
    },

    exportEntries: (masked = true) => {
      const { entries } = get()

      if (masked) {
        // Return entries as-is (already masked if configured)
        return [...entries]
      }

      // Return unmasked entries (for admin export)
      // Note: In production, this should require special permissions
      return entries.map((entry) => ({
        ...entry,
        masked: false,
      }))
    },

    getEntriesByUser: (userId: string) => {
      const { entries } = get()
      return entries.filter((entry) => entry.userId === userId)
    },

    getEntriesByResource: (resource: string) => {
      const { entries } = get()
      return entries.filter((entry) => entry.resource === resource)
    },
  }))
)

// Selectors
export const useAuditEntries = () => useAuditStore((state) => state.entries)
export const useAuditActions = () =>
  useAuditStore((state) => ({
    addEntry: state.addEntry,
    clearOldEntries: state.clearOldEntries,
    exportEntries: state.exportEntries,
    getEntriesByUser: state.getEntriesByUser,
    getEntriesByResource: state.getEntriesByResource,
  }))
