import * as React from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Input } from "./input"
import { Label } from "./label"
import { HoverHelp } from "./hover-help"
import { cn } from "@/lib/utils"

/**
 * Form field types
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

/**
 * Validation rules
 */
export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  custom?: (value: unknown) => string | true
}

/**
 * Field placement and sizing
 */
export interface FieldLayout {
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 // Grid columns (12-column grid)
  rowSpan?: 1 | 2 | 3 | 4 // Grid rows
  order?: number // Display order
  size?: "sm" | "md" | "lg" | "xl" // Field size
  width?: "auto" | "full" | "half" | "third" | "quarter" | string // Width control
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

/**
 * Form field configuration
 */
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
  groupId?: string // For grouping fields together
}

/**
 * Form field group/section
 */
export interface FormFieldGroup {
  id: string
  title?: string
  description?: string
  fields: FormField[]
  collapsible?: boolean
  defaultCollapsed?: boolean
}

/**
 * Form configuration
 */
export interface FormConfig {
  id: string
  title?: string
  description?: string
  fields: FormField[]
  groups?: FormFieldGroup[] // Optional field groups/sections
  submitLabel?: string
  cancelLabel?: string
  showCancel?: boolean
  layout?: "single" | "two-column" | "three-column" | "four-column" | "custom"
  gridColumns?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 // Custom grid columns
  gap?: "none" | "sm" | "md" | "lg" | "xl" // Grid gap
  className?: string
}

/**
 * Form builder props
 */
export interface FormBuilderProps {
  config: FormConfig
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>
  onCancel?: () => void
  initialValues?: Record<string, unknown>
  className?: string
}

/**
 * Form Field Group Component - Renders a collapsible section of fields
 */
function FormFieldGroupComponent({
  group,
  fields,
  renderField,
  getGridLayoutClasses,
  getGapClasses,
}: {
  group: FormFieldGroup
  fields: FormField[]
  renderField: (field: FormField) => React.ReactNode
  getGridLayoutClasses: () => string
  getGapClasses: () => string
}) {
  const [isCollapsed, setIsCollapsed] = React.useState(group.defaultCollapsed || false)

  return (
    <div key={group.id} className="col-span-12">
      <Card className="overflow-visible">
        {(group.title || group.description) && (
          <CardHeader
            className={cn(
              "cursor-pointer select-none",
              group.collapsible && "hover:bg-muted/50 transition-colors"
            )}
            onClick={() => group.collapsible && setIsCollapsed(!isCollapsed)}
          >
            <div className="flex items-center justify-between">
              <div>
                {group.title && <CardTitle className="text-lg">{group.title}</CardTitle>}
                {group.description && (
                  <CardDescription className="mt-1">{group.description}</CardDescription>
                )}
              </div>
              {group.collapsible && (
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
        )}
        {!isCollapsed && (
          <CardContent className="pt-6">
            <div className={cn("grid", getGridLayoutClasses(), getGapClasses(), "auto-rows-min")}>
              {fields.map(renderField)}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

/**
 * Dynamic Form Builder Component
 * Builds forms dynamically based on configuration
 */
export function FormBuilder({
  config,
  onSubmit,
  onCancel,
  initialValues = {},
  className,
}: FormBuilderProps) {
  const [formData, setFormData] = React.useState<Record<string, unknown>>(initialValues)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [touched, setTouched] = React.useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Update form data when initial values change
  React.useEffect(() => {
    setFormData(initialValues)
  }, [initialValues])

  // Validate field
  const validateField = (field: FormField, value: unknown): string | true => {
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

  // Handle field change
  const handleChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))

    // Validate on change if field has been touched
    if (touched[fieldId]) {
      const field = config.fields.find((f) => f.id === fieldId)
      if (field) {
        const error = validateField(field, value)
        setErrors((prev) => ({
          ...prev,
          [fieldId]: error === true ? "" : error,
        }))
      }
    }
  }

  // Handle blur
  const handleBlur = (fieldId: string) => {
    setTouched((prev) => ({ ...prev, [fieldId]: true }))
    const field = config.fields.find((f) => f.id === fieldId)
    if (field) {
      const value = formData[fieldId]
      const error = validateField(field, value)
      setErrors((prev) => ({
        ...prev,
        [fieldId]: error === true ? "" : error,
      }))
    }
  }

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    let isValid = true

    config.fields.forEach((field) => {
      const value = formData[field.id]
      const error = validateField(field, value)
      if (error !== true) {
        newErrors[field.id] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(
      config.fields.reduce((acc, field) => {
        acc[field.id] = true
        return acc
      }, {} as Record<string, boolean>)
    )

    return isValid
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if field should be visible (based on dependencies)
  const isFieldVisible = (field: FormField): boolean => {
    if (!field.dependencies) return true
    const dependencyValue = formData[field.dependencies.field]
    return field.dependencies.condition(dependencyValue)
  }

  // Get field size classes
  const getFieldSizeClasses = (size?: FieldLayout["size"]) => {
    switch (size) {
      case "sm":
        return "h-9 text-sm px-3"
      case "lg":
        return "h-12 text-base px-5"
      case "xl":
        return "h-14 text-lg px-6"
      default:
        return "h-11 text-sm px-4" // md
    }
  }

  // Get margin classes
  const getMarginClasses = (margin?: FieldLayout["margin"]) => {
    if (!margin) return ""
    const classes: string[] = []
    const marginMap: Record<string, string> = {
      none: "0",
      sm: "2",
      md: "4",
      lg: "6",
      xl: "8",
    }
    if (margin.top) classes.push(`mt-${marginMap[margin.top] || margin.top}`)
    if (margin.bottom) classes.push(`mb-${marginMap[margin.bottom] || margin.bottom}`)
    if (margin.left) classes.push(`ml-${marginMap[margin.left] || margin.left}`)
    if (margin.right) classes.push(`mr-${marginMap[margin.right] || margin.right}`)
    return classes.join(" ")
  }

  // Get padding classes
  const getPaddingClasses = (padding?: FieldLayout["padding"]) => {
    if (!padding) return ""
    const classes: string[] = []
    const paddingMap: Record<string, string> = {
      none: "0",
      sm: "2",
      md: "4",
      lg: "6",
      xl: "8",
    }
    if (padding.top) classes.push(`pt-${paddingMap[padding.top] || padding.top}`)
    if (padding.bottom) classes.push(`pb-${paddingMap[padding.bottom] || padding.bottom}`)
    if (padding.left) classes.push(`pl-${paddingMap[padding.left] || padding.left}`)
    if (padding.right) classes.push(`pr-${paddingMap[padding.right] || padding.right}`)
    return classes.join(" ")
  }

  // Get width classes
  const getWidthClasses = (width?: FieldLayout["width"]) => {
    if (!width) return "w-full"
    switch (width) {
      case "full":
        return "w-full"
      case "half":
        return "w-1/2"
      case "third":
        return "w-1/3"
      case "quarter":
        return "w-1/4"
      case "auto":
        return "w-auto"
      default:
        return width // Custom width class
    }
  }

  // Get alignment classes
  const getAlignmentClasses = (alignment?: FieldLayout["alignment"]) => {
    if (!alignment) return ""
    const classes: string[] = []
    if (alignment.horizontal) {
      switch (alignment.horizontal) {
        case "left":
          classes.push("text-left")
          break
        case "center":
          classes.push("text-center")
          break
        case "right":
          classes.push("text-right")
          break
        case "stretch":
          classes.push("w-full")
          break
      }
    }
    if (alignment.vertical) {
      switch (alignment.vertical) {
        case "top":
          classes.push("items-start")
          break
        case "center":
          classes.push("items-center")
          break
        case "bottom":
          classes.push("items-end")
          break
        case "stretch":
          classes.push("items-stretch")
          break
      }
    }
    return classes.join(" ")
  }

  // Get grid column span
  const getGridColSpan = (colSpan?: FieldLayout["colSpan"]) => {
    if (!colSpan) return ""
    const colSpanMap: Record<number, string> = {
      1: "col-span-1",
      2: "col-span-2",
      3: "col-span-3",
      4: "col-span-4",
      5: "col-span-5",
      6: "col-span-6",
      7: "col-span-7",
      8: "col-span-8",
      9: "col-span-9",
      10: "col-span-10",
      11: "col-span-11",
      12: "col-span-12",
    }
    return colSpanMap[colSpan] || ""
  }

  // Render field based on type
  const renderField = (field: FormField) => {
    if (!isFieldVisible(field)) return null

    const value = formData[field.id] ?? field.defaultValue ?? ""
    const error = errors[field.id]
    const hasError = touched[field.id] && error
    const layout = field.layout || {}

    const baseInputProps = {
      id: field.id,
      name: field.name || field.id,
      value: value as string | number,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        handleChange(field.id, e.target.value)
      },
      onBlur: () => handleBlur(field.id),
      disabled: field.disabled,
      readOnly: field.readonly,
      "aria-invalid": hasError ? "true" : "false",
      "aria-describedby": hasError ? `${field.id}-error` : undefined,
      className: cn(
        field.className,
        hasError && "border-destructive",
        getFieldSizeClasses(layout.size),
        getWidthClasses(layout.width),
        "px-4"
      ),
    }

    const fieldContainerClasses = cn(
      "space-y-2",
      getGridColSpan(layout.colSpan),
      getMarginClasses(layout.margin),
      getPaddingClasses(layout.padding),
      getAlignmentClasses(layout.alignment),
      layout.order && `order-${layout.order}`
    )

    // Handle separator type
    if (field.type === "separator") {
      return (
        <div key={field.id} className={cn("col-span-12 my-4", field.className)}>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E1E4E8] dark:border-[#3B3B3B]"></div>
            </div>
            {field.label && (
              <div className="relative flex justify-center text-sm">
                <span className="bg-background px-4 text-muted-foreground">{field.label}</span>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Handle display-text type
    if (field.type === "display-text") {
      return (
        <div key={field.id} className={cn(fieldContainerClasses, field.className)}>
          {field.label && (
            <h3 className={cn(
              "text-base font-semibold",
              layout.size === "sm" && "text-sm",
              layout.size === "lg" && "text-lg",
              layout.size === "xl" && "text-xl"
            )}>
              {field.label}
            </h3>
          )}
          {field.description && (
            <p className={cn(
              "text-sm text-muted-foreground",
              layout.size === "sm" && "text-xs",
              layout.size === "lg" && "text-base"
            )}>
              {field.description}
            </p>
          )}
        </div>
      )
    }

    return (
      <div key={field.id} className={fieldContainerClasses} style={layout.order ? { order: layout.order } : undefined}>
        {field.label && (
          <Label htmlFor={field.id} help={field.help}>
            {field.label}
            {field.validation?.required && (
              <span className="text-destructive ml-1" aria-label="required">
                *
              </span>
            )}
          </Label>
        )}
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}

        {field.type === "textarea" ? (
          <textarea
            {...baseInputProps}
            rows={layout.size === "sm" ? 3 : layout.size === "lg" ? 6 : layout.size === "xl" ? 8 : 4}
            placeholder={field.placeholder}
            className={cn(
              "flex w-full rounded-xs border border-[#E1E4E8] bg-background px-4 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary hover:border-[#D0D6DB] transition-fluent disabled:cursor-not-allowed disabled:opacity-50",
              hasError && "border-destructive",
              getFieldSizeClasses(layout.size),
              getWidthClasses(layout.width),
              layout.size === "sm" ? "min-h-[60px]" : layout.size === "lg" ? "min-h-[120px]" : layout.size === "xl" ? "min-h-[160px]" : "min-h-[80px]",
              field.className
            )}
          />
        ) : field.type === "select" || field.type === "multiselect" ? (
          <select
            {...(baseInputProps as React.SelectHTMLAttributes<HTMLSelectElement>)}
            multiple={field.type === "multiselect"}
            className={cn(
              "flex w-full rounded-xs border border-[#E1E4E8] bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary hover:border-[#D0D6DB] transition-fluent disabled:cursor-not-allowed disabled:opacity-50",
              hasError && "border-destructive",
              getFieldSizeClasses(layout.size),
              getWidthClasses(layout.width),
              field.className
            )}
          >
            {field.placeholder && <option value="">{field.placeholder}</option>}
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === "checkbox" ? (
          <div className={cn("flex items-center space-x-2", getWidthClasses(layout.width))}>
            <input
              type="checkbox"
              id={field.id}
              name={field.name || field.id}
              checked={Boolean(value)}
              onChange={(e) => handleChange(field.id, e.target.checked)}
              onBlur={() => handleBlur(field.id)}
              disabled={field.disabled}
              className={cn(
                "rounded-xs border border-[#E1E4E8] text-primary focus:ring-2 focus:ring-ring transition-fluent",
                layout.size === "sm" ? "h-3.5 w-3.5" : layout.size === "lg" ? "h-5 w-5" : "h-4 w-4"
              )}
            />
            <Label htmlFor={field.id} className="font-normal">
              {field.description || field.label}
            </Label>
          </div>
        ) : field.type === "radio" && field.options ? (
          <div className={cn("space-y-2", getWidthClasses(layout.width))}>
            {field.options.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <input
                  type="radio"
                  id={`${field.id}-${option.value}`}
                  name={field.name || field.id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleChange(field.id, e.target.value)}
                  onBlur={() => handleBlur(field.id)}
                  disabled={field.disabled}
                  className={cn(
                    "border border-[#E1E4E8] text-primary focus:ring-2 focus:ring-ring transition-fluent",
                    layout.size === "sm" ? "h-3.5 w-3.5" : layout.size === "lg" ? "h-5 w-5" : "h-4 w-4"
                  )}
                />
                <Label htmlFor={`${field.id}-${option.value}`} className="font-normal">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <Input
            {...baseInputProps}
            type={field.type}
            placeholder={field.placeholder}
            help={field.help}
            className={cn(
              baseInputProps.className,
              getFieldSizeClasses(layout.size),
              getWidthClasses(layout.width)
            )}
          />
        )}

        {hasError && (
          <p id={`${field.id}-error`} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }

  // Get grid layout classes
  const getGridLayoutClasses = () => {
    if (config.layout === "custom" && config.gridColumns) {
      const customColMap: Record<number, string> = {
        1: "grid-cols-1",
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-4",
        5: "grid-cols-5",
        6: "grid-cols-6",
        7: "grid-cols-7",
        8: "grid-cols-8",
        9: "grid-cols-9",
        10: "grid-cols-10",
        11: "grid-cols-11",
        12: "grid-cols-12",
      }
      return customColMap[config.gridColumns] || "grid-cols-1"
    }
    
    const layoutMap: Record<string, string> = {
      "single": "grid-cols-1",
      "two-column": "grid-cols-1 md:grid-cols-2",
      "three-column": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
      "four-column": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    }
    
    return layoutMap[config.layout || "single"] || layoutMap["single"]
  }

  // Get gap classes
  const getGapClasses = () => {
    const gapMap: Record<string, string> = {
      "none": "gap-0",
      "sm": "gap-2",
      "md": "gap-4",
      "lg": "gap-6",
      "xl": "gap-8",
    }
    return gapMap[config.gap || "md"] || gapMap["md"]
  }

  // Sort fields by order if specified
  const sortedFields = React.useMemo(() => {
    return [...config.fields].sort((a, b) => {
      const orderA = a.layout?.order ?? 0
      const orderB = b.layout?.order ?? 0
      return orderA - orderB
    })
  }, [config.fields])

  // Group fields if groups are defined
  const renderFieldsWithGroups = () => {
    if (config.groups && config.groups.length > 0) {
      return config.groups.map((group) => {
        const groupFields = sortedFields.filter((f) => f.groupId === group.id)
        if (groupFields.length === 0) return null

        return (
          <FormFieldGroupComponent
            key={group.id}
            group={group}
            fields={groupFields}
            renderField={renderField}
          />
        )
      })
    }
    return sortedFields.map(renderField)
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6 overflow-auto", className)} noValidate>
      {(config.title || config.description) && (
        <div>
          {config.title && <h2 className="text-2xl font-semibold mb-2">{config.title}</h2>}
          {config.description && (
            <p className="text-sm text-muted-foreground">{config.description}</p>
          )}
        </div>
      )}

      <div className={cn("grid", getGridLayoutClasses(), getGapClasses(), "auto-rows-min")}>
        {renderFieldsWithGroups()}
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        {config.showCancel && onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            {config.cancelLabel || "Cancel"}
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : config.submitLabel || "Submit"}
        </Button>
      </div>
    </form>
  )
}

