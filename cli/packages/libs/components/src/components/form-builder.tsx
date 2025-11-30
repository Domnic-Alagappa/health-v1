/**
 * Form Builder Types and Exports
 * This file contains type definitions and re-exports the FormBuilder component
 */

export type FieldType =
  | "text"
  | "email"
  | "number"
  | "tel"
  | "url"
  | "password"
  | "textarea"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "datetime-local"
  | "time"
  | "file"
  | "multiselect"
  | "switch"
  | "toggle"
  | "slider"
  | "rating"
  | "input-otp"
  | "combobox"
  | "display-text"
  | "separator"

export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  custom?: (value: unknown) => string | true
}

export interface FieldLayout {
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  rowSpan?: 1 | 2 | 3 | 4
  order?: number
  size?: "sm" | "md" | "lg" | "xl"
  width?: "auto" | "full" | "half" | "third" | "quarter" | string
  margin?: {
    top?: "none" | "sm" | "md" | "lg" | "xl"
    bottom?: "none" | "sm" | "md" | "lg" | "xl"
    left?: "none" | "sm" | "md" | "lg" | "xl"
    right?: "none" | "sm" | "md" | "lg" | "xl"
  }
  padding?: {
    top?: "none" | "sm" | "md" | "lg" | "xl"
    bottom?: "none" | "sm" | "md" | "lg" | "xl"
    left?: "none" | "sm" | "md" | "lg" | "xl"
    right?: "none" | "sm" | "md" | "lg" | "xl"
  }
  alignment?: {
    horizontal?: "left" | "center" | "right" | "stretch"
    vertical?: "top" | "center" | "bottom" | "stretch"
  }
}

export interface FormField {
  id: string
  name: string
  label: string
  type: FieldType
  placeholder?: string
  description?: string
  help?: {
    content: string | React.ReactNode
    title?: string
  }
  defaultValue?: unknown
  options?: Array<{ label: string; value: string }>
  validation?: ValidationRule
  disabled?: boolean
  readonly?: boolean
  className?: string
  layout?: FieldLayout
  dependencies?: {
    field: string
    condition: (value: unknown) => boolean
  }
  groupId?: string
}

export interface FormFieldGroup {
  id: string
  title?: string
  description?: string
  fields: FormField[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface FormConfig {
  id: string
  title?: string
  description?: string
  fields: FormField[]
  groups?: FormFieldGroup[]
  submitLabel?: string
  cancelLabel?: string
  showCancel?: boolean
  layout?: "single" | "two-column" | "three-column" | "four-column" | "custom"
  gridColumns?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
  gap?: "none" | "sm" | "md" | "lg" | "xl"
  className?: string
}

export interface FormBuilderProps {
  config: FormConfig
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>
  onCancel?: () => void
  initialValues?: Record<string, unknown>
  className?: string
}

// Re-export the refactored FormBuilder component
export { FormBuilder } from "@/components/forms/builder"
