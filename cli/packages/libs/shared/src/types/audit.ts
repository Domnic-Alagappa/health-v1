/**
 * Audit-related types
 */

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: string;
  details?: Record<string, unknown>;
  masked: boolean;
}
