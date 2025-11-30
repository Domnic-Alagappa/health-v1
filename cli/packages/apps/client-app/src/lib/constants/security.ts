/**
 * Security Configuration
 * Security policies, masking rules, immutable fields, and audit configuration
 */

export const SECURITY_CONFIG = {
  // Token expiration (in seconds)
  TOKEN_EXPIRATION: 3600, // 1 hour
  REFRESH_TOKEN_EXPIRATION: 604800, // 7 days

  // Masking rules
  MASKING: {
    SSN: {
      level: "partial" as const,
      visibleChars: 4,
      maskChar: "*",
      format: "xxx-xx-####",
    },
    EMAIL: {
      level: "partial" as const,
      visibleLocalChars: 2,
      showDomain: true,
    },
    PHONE: {
      level: "partial" as const,
      visibleChars: 4,
      format: "xxx-xxx-####",
    },
    MRN: {
      level: "partial" as const,
      visibleChars: 4,
    },
    CREDIT_CARD: {
      level: "complete" as const,
    },
  },

  // Immutable fields - cannot be modified after creation
  IMMUTABLE_FIELDS: [
    "id",
    "patientId",
    "ssn",
    "dateOfBirth",
    "createdAt",
    "createdBy",
    "auditTrail",
  ] as const,

  // Audit configuration
  AUDIT: {
    LOG_PHI_ACCESS: true,
    LOG_STATE_CHANGES: true,
    RETENTION_DAYS: 2555, // 7 years (HIPAA requirement)
    MASK_IN_LOGS: true,
  },
} as const

export type MaskingLevel = "partial" | "complete"
export type ImmutableField = (typeof SECURITY_CONFIG.IMMUTABLE_FIELDS)[number]
