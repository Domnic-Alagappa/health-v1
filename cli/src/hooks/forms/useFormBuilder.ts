import { useEffect, useMemo, useState } from "react"
import type { FormConfig, FormField } from "@/components/ui/form-builder"
import { validateField } from "@/lib/formValidationUtils"

interface UseFormBuilderOptions {
  config: FormConfig
  initialValues?: Record<string, unknown>
}

export function useFormBuilder({ config, initialValues = {} }: UseFormBuilderOptions) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setFormData(initialValues)
  }, [initialValues])

  const handleChange = (fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))

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
      config.fields.reduce(
        (acc, field) => {
          acc[field.id] = true
          return acc
        },
        {} as Record<string, boolean>
      )
    )

    return isValid
  }

  const isFieldVisible = (field: FormField): boolean => {
    if (!field.dependencies) return true
    const dependencyValue = formData[field.dependencies.field]
    return field.dependencies.condition(dependencyValue)
  }

  const sortedFields = useMemo(() => {
    return [...config.fields].sort((a, b) => {
      const orderA = a.layout?.order ?? 0
      const orderB = b.layout?.order ?? 0
      return orderA - orderB
    })
  }, [config.fields])

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validateForm,
    isFieldVisible,
    sortedFields,
  }
}
