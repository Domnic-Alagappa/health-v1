/**
 * Audit API
 * Audit logging utilities for tracking sensitive operations
 */

import { SECURITY_CONFIG } from "@health-v1/shared/constants/security";
import { apiClient } from "./client";
import { maskObject } from "./masking";
import type { AuditEntry } from "./types";

/**
 * Log an audit entry
 */
export async function logAuditEntry(
  entry: Omit<AuditEntry, "id" | "timestamp" | "masked">
): Promise<void> {
  if (!SECURITY_CONFIG.AUDIT.LOG_PHI_ACCESS) {
    return; // Audit logging disabled
  }

  const auditEntry: AuditEntry = {
    id: crypto.randomUUID(),
    ...entry,
    timestamp: new Date().toISOString(),
    masked: SECURITY_CONFIG.AUDIT.MASK_IN_LOGS,
  };

  // Mask PHI in audit entry if configured
  if (SECURITY_CONFIG.AUDIT.MASK_IN_LOGS && auditEntry.details) {
    const fieldsToMask = ["ssn", "email", "phone", "mrn", "creditCard", "patientId"];
    auditEntry.details = maskObject(auditEntry.details, fieldsToMask);
  }

  // In a real implementation, this would send to the audit API
  // For now, we'll log to console in development
  if (import.meta.env.DEV) {
    console.debug("Audit Entry:", auditEntry);
  }

  // TODO: Send to audit API endpoint when available
  // await apiClient.post('/audit', auditEntry);
}

/**
 * Log PHI access
 */
export function logPHIAccess(
  userId: string,
  resource: string,
  resourceId?: string,
  details?: Record<string, unknown>
): void {
  logAuditEntry({
    userId,
    action: "PHI_ACCESS",
    resource,
    resourceId,
    details,
  });
}

/**
 * Log state change
 */
export function logStateChange(
  userId: string,
  resource: string,
  action: string,
  resourceId?: string,
  details?: Record<string, unknown>
): void {
  if (!SECURITY_CONFIG.AUDIT.LOG_STATE_CHANGES) {
    return;
  }

  logAuditEntry({
    userId,
    action: `STATE_CHANGE:${action}`,
    resource,
    resourceId,
    details,
  });
}

/**
 * Log permission check
 */
export function logPermissionCheck(
  userId: string,
  permission: string,
  granted: boolean,
  resource?: string
): void {
  logAuditEntry({
    userId,
    action: "PERMISSION_CHECK",
    resource: resource || "system",
    details: {
      permission,
      granted,
    },
  });
}

/**
 * Log access denied
 */
export function logAccessDenied(
  userId: string,
  resource: string,
  requiredPermission: string,
  userRole?: string
): void {
  logAuditEntry({
    userId,
    action: "ACCESS_DENIED",
    resource,
    details: {
      requiredPermission,
      userRole,
    },
  });
}
