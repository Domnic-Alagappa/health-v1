import * as React from "react"
import { Input } from "./input"
import { Label } from "./label"
import { cn } from "@/lib/utils"

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

/**
 * Individual form field component
 * Can be used standalone or within FormBuilder
 */
export function FormField({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  required,
  disabled,
  placeholder,
  description,
  help,
  className,
}: FormFieldProps) {
  const hasError = Boolean(error)

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id} help={help}>
        {label}
        {required && (
          <span className="text-destructive ml-1" aria-label="required">
            *
          </span>
        )}
      </Label>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}

      <Input
        id={id}
        type={type}
        value={String(value ?? "")}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        help={help}
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={cn(hasError && "border-destructive")}
      />

      {hasError && (
        <p id={`${id}-error`} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

