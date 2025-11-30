/**
 * Masking Utilities
 * Frontend masking utilities mirroring backend functionality
 * Supports complete, partial, and contextual masking
 */

import { type MaskingLevel, SECURITY_CONFIG } from "@health-v1/shared/constants/security";

export interface MaskingConfig {
  level: MaskingLevel;
  visibleChars?: number;
  maskChar?: string;
  format?: string;
}

/**
 * Mask a field value with specified configuration
 */
export function maskField(value: string, visibleChars: number, maskChar = "*"): string {
  if (!value || value.length <= visibleChars) {
    return value;
  }

  const visible = value.slice(-visibleChars);
  const maskedLen = value.length - visibleChars;
  const masked = maskChar.repeat(maskedLen);

  return `${masked}${visible}`;
}

/**
 * Mask SSN (Social Security Number)
 * Format: ***-**-1234
 */
export function maskSSN(value: string, level: MaskingLevel = "partial"): string {
  if (!value) return "";

  if (level === "complete") {
    return "[REDACTED]";
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length === 9) {
    const lastFour = digits.slice(-4);
    return `***-**-${lastFour}`;
  }

  return maskField(value, 0);
}

/**
 * Mask email address
 * Format: **st@example.com
 */
export function maskEmail(value: string, level: MaskingLevel = "partial"): string {
  if (!value) return "";

  if (level === "complete") {
    return "[REDACTED]";
  }

  const atPos = value.indexOf("@");
  if (atPos === -1) {
    return maskField(value, 2);
  }

  const local = value.slice(0, atPos);
  const domain = value.slice(atPos);
  const visible = local.slice(-2);
  const maskedLocal = "*".repeat(Math.max(0, local.length - 2));

  return `${maskedLocal}${visible}${domain}`;
}

/**
 * Mask phone number
 * Format: ***-***-7890
 */
export function maskPhone(value: string, level: MaskingLevel = "partial"): string {
  if (!value) return "";

  if (level === "complete") {
    return "[REDACTED]";
  }

  const digits = value.replace(/\D/g, "");
  if (digits.length >= 4) {
    const lastFour = digits.slice(-4);
    return `***-***-${lastFour}`;
  }

  return maskField(value, 0);
}

/**
 * Mask Medical Record Number (MRN)
 */
export function maskMRN(value: string, level: MaskingLevel = "partial"): string {
  if (!value) return "";

  if (level === "complete") {
    return "[REDACTED]";
  }

  const config = SECURITY_CONFIG.MASKING.MRN;
  return maskField(value, config.visibleChars, config.maskChar);
}

/**
 * Mask credit card number
 * Always completely masked
 */
export function maskCreditCard(value: string): string {
  if (!value) return "";
  return "[REDACTED]";
}

/**
 * Contextual masking based on field type and user role
 */
export function contextualMask(value: string, field: string, userRole: string): string {
  // Get masking level based on user role
  const level = getMaskingLevel(field, userRole);

  // Apply appropriate masker
  switch (field.toLowerCase()) {
    case "ssn":
      return maskSSN(value, level);
    case "email":
      return maskEmail(value, level);
    case "phone":
      return maskPhone(value, level);
    case "mrn":
      return maskMRN(value, level);
    case "creditcard":
    case "credit_card":
      return maskCreditCard(value);
    default:
      // Default to partial masking
      return maskField(value, 4);
  }
}

/**
 * Get masking level based on user role
 * Admin: no masking, Doctor: partial, Nurse: more aggressive, Receptionist: complete
 */
function getMaskingLevel(field: string, userRole: string): MaskingLevel {
  switch (userRole.toLowerCase()) {
    case "admin":
      return "partial"; // Admin can see partial
    case "doctor":
      return "partial";
    case "nurse":
      return "partial";
    case "receptionist":
      return "complete"; // Receptionist sees complete mask
    default:
      return "complete"; // Default to most secure
  }
}

/**
 * Mask an object's sensitive fields
 */
export function maskObject<T extends Record<string, unknown>>(
  obj: T,
  fieldsToMask: string[],
  userRole = "receptionist"
): T {
  const masked = { ...obj };

  for (const field of fieldsToMask) {
    if (field in masked && typeof masked[field] === "string") {
      masked[field] = contextualMask(String(masked[field]), field, userRole);
    }
  }

  return masked;
}
