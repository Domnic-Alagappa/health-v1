/**
 * Form component prop types
 */

import type * as React from "react"

export interface FormField {
  id: string
  label: string
  type: string
  required?: boolean
  placeholder?: string
  defaultValue?: unknown
  validation?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: string
    min?: number
    max?: number
  }
}

export interface FormFieldGroup {
  id: string
  label: string
  fields: string[] // Field IDs
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

export interface FormFieldProps {
  id: string
  label: string
  type?: string
  value?: unknown
  onChange?: (value: unknown) => void
  onBlur?: () => void
  error?: string
  required?: boolean
  disabled?: boolean
  placeholder?: string
  description?: string
  help?: {
    content: string | React.ReactNode
    title?: string
  }
  className?: string
}

