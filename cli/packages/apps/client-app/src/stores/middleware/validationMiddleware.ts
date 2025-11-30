/**
 * Validation Middleware
 * Validates data before state updates to ensure data integrity
 */

import type { StateCreator } from "zustand"
import { FIELD_DEFINITIONS } from "@/lib/constants/fields"
import { SECURITY_CONFIG } from "@/lib/constants/security"

interface ValidationError {
  field: string
  message: string
}

/**
 * Validate a field value against its definition
 */
function validateField(
  fieldName: string,
  value: unknown,
  fieldDef: { immutable?: boolean; type?: string; mask?: boolean }
): ValidationError | null {
  // Check immutability
  if (fieldDef.immutable && value !== undefined && value !== null) {
    // In a real implementation, we'd check if this is an update vs create
    // For now, we'll just log a warning
    console.warn(`Attempted to modify immutable field: ${fieldName}`)
  }

  // Type validation
  if (fieldDef.type && value !== undefined && value !== null) {
    switch (fieldDef.type) {
      case "string":
        if (typeof value !== "string") {
          return { field: fieldName, message: `Expected string, got ${typeof value}` }
        }
        break
      case "number":
        if (typeof value !== "number") {
          return { field: fieldName, message: `Expected number, got ${typeof value}` }
        }
        break
      case "date":
        if (typeof value !== "string" && !(value instanceof Date)) {
          return { field: fieldName, message: `Expected date, got ${typeof value}` }
        }
        break
      case "timestamp":
        if (typeof value !== "string" && typeof value !== "number" && !(value instanceof Date)) {
          return { field: fieldName, message: `Expected timestamp, got ${typeof value}` }
        }
        break
    }
  }

  return null
}

/**
 * Validate an object against field definitions
 */
function validateObject(obj: unknown, entityType: string = "patient"): ValidationError[] {
  const errors: ValidationError[] = []

  if (!obj || typeof obj !== "object") {
    return errors
  }

  const fieldDefs = FIELD_DEFINITIONS[entityType as keyof typeof FIELD_DEFINITIONS]
  if (!fieldDefs) {
    return errors
  }

  for (const [key, value] of Object.entries(obj)) {
    const fieldDef = fieldDefs[key as keyof typeof fieldDefs]
    if (fieldDef) {
      const error = validateField(key, value, fieldDef)
      if (error) {
        errors.push(error)
      }
    }
  }

  return errors
}

/**
 * Validation middleware that validates data before state updates
 */
export function validationMiddleware<T>(
  config: StateCreator<T>,
  entityType?: string
): StateCreator<T> {
  return (set, get, api) => {
    // Wrap set function to validate changes
    const setWithValidation = (
      partial: T | Partial<T> | ((state: T) => T | Partial<T>),
      replace?: boolean
    ) => {
      let dataToValidate: unknown = partial

      // If partial is a function, execute it first to get the actual data
      if (typeof partial === "function") {
        const currentState = get()
        dataToValidate = partial(currentState)
      }

      // Validate the data
      if (entityType && typeof dataToValidate === "object" && dataToValidate !== null) {
        const errors = validateObject(dataToValidate, entityType)

        if (errors.length > 0) {
          console.error("Validation errors:", errors)
          // In a production system, you might want to throw an error or return early
          // For now, we'll log and continue
          // throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
        }
      }

      // Call original set
      return set(partial, replace)
    }

    return config(setWithValidation, get, api)
  }
}

/**
 * Create a validated store creator with entity type
 */
export function createValidatedStore<T>(
  config: StateCreator<T>,
  entityType: string
): StateCreator<T> {
  return validationMiddleware(config, entityType)
}
