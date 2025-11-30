/**
 * Audit store types
 */

import type { AuditEntry } from "../audit"

export interface AuditState {
  entries: readonly AuditEntry[]
  maxEntries: number
}

export interface AuditActions {
  addEntry: (entry: Omit<AuditEntry, "id" | "timestamp" | "masked">) => void
  clearOldEntries: () => void
  exportEntries: (masked?: boolean) => AuditEntry[]
  getEntriesByUser: (userId: string) => readonly AuditEntry[]
  getEntriesByResource: (resource: string) => readonly AuditEntry[]
}

export type AuditStore = AuditState & AuditActions

