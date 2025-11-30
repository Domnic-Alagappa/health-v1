/**
 * Field Definitions
 * Metadata for UI rendering, validation, and security
 */

export const FIELD_DEFINITIONS = {
  patient: {
    id: { immutable: true, mask: false, type: "string" },
    patientId: { immutable: true, mask: false, type: "string" },
    ssn: { immutable: true, mask: true, level: "partial" as const },
    firstName: { immutable: false, mask: false, type: "string" },
    lastName: { immutable: false, mask: false, type: "string" },
    dateOfBirth: { immutable: true, mask: false, type: "date" },
    email: { immutable: false, mask: true, level: "partial" as const },
    phone: { immutable: false, mask: true, level: "partial" as const },
    createdAt: { immutable: true, mask: false, type: "timestamp" },
    createdBy: { immutable: true, mask: false, type: "string" },
    auditTrail: { immutable: true, mask: false, type: "array" },
  },
  user: {
    id: { immutable: true, mask: false, type: "string" },
    email: { immutable: false, mask: true, level: "partial" as const },
    username: { immutable: false, mask: false, type: "string" },
    createdAt: { immutable: true, mask: false, type: "timestamp" },
  },
} as const;

export type FieldType = "string" | "number" | "date" | "timestamp" | "array" | "boolean";
export type EntityType = keyof typeof FIELD_DEFINITIONS;
export type FieldName<T extends EntityType> = keyof (typeof FIELD_DEFINITIONS)[T];
