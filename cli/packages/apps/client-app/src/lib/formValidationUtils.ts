import type { FormField, ValidationRule } from "@/components/ui/form-builder"

export function validateField(field: FormField, value: unknown): string | true {
  if (!field.validation) return true

  const rules = field.validation

  // Required check
  if (rules.required && (value === undefined || value === null || value === "")) {
    return `${field.label} is required`
  }

  // Skip other validations if empty and not required
  if (value === undefined || value === null || value === "") {
    return true
  }

  // Type-specific validations
  if (typeof value === "string") {
    if (rules.minLength && value.length < rules.minLength) {
      return `${field.label} must be at least ${rules.minLength} characters`
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return `${field.label} must be no more than ${rules.maxLength} characters`
    }
    if (rules.pattern) {
      const regex = new RegExp(rules.pattern)
      if (!regex.test(value)) {
        return `${field.label} format is invalid`
      }
    }
  }

  if (typeof value === "number") {
    if (rules.min !== undefined && value < rules.min) {
      return `${field.label} must be at least ${rules.min}`
    }
    if (rules.max !== undefined && value > rules.max) {
      return `${field.label} must be no more than ${rules.max}`
    }
  }

  // Custom validation
  if (rules.custom) {
    const result = rules.custom(value)
    if (result !== true) {
      return result
    }
  }

  return true
}
