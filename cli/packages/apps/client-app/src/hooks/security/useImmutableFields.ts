/**
 * useImmutableFields Hook
 * Hook for validating and protecting immutable fields
 */

import { useCallback } from "react"
import { FIELD_DEFINITIONS, SECURITY_CONFIG } from "@health-v1/shared/constants"
import type { EntityType, FieldName } from "@health-v1/shared/constants/fields"

export function useImmutableFields() {
  const isImmutable = useCallback(
    <T extends EntityType>(entityType: T, fieldName: FieldName<T>): boolean => {
      const fieldDef = FIELD_DEFINITIONS[entityType]?.[fieldName]
      return fieldDef?.immutable ?? false
    },
    []
  )

  const validateFieldUpdate = useCallback(
    <T extends EntityType>(
      entityType: T,
      fieldName: FieldName<T>,
      newValue: unknown
    ): { valid: boolean; error?: string } => {
      if (isImmutable(entityType, fieldName)) {
        return {
          valid: false,
          error: `Field "${String(fieldName)}" is immutable and cannot be modified`,
        }
      }

      return { valid: true }
    },
    [isImmutable]
  )

  const getImmutableFields = useCallback(<T extends EntityType>(entityType: T): string[] => {
    const fields = FIELD_DEFINITIONS[entityType]
    if (!fields) return []

    return Object.entries(fields)
      .filter(([, def]) => def.immutable)
      .map(([fieldName]) => fieldName)
  }, [])

  return {
    isImmutable,
    validateFieldUpdate,
    getImmutableFields,
  }
}
