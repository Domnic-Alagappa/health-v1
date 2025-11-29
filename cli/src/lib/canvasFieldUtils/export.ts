import type { CanvasField } from "@/components/forms/canvas/types"
import type { FormConfig } from "@/components/ui/form-builder"

export function exportCanvasConfig(
  fields: CanvasField[],
  canvasConfig: {
    id?: string
    title?: string
    description?: string
    layout?: string
    gap?: "none" | "sm" | "md" | "lg" | "xl"
    canvasWidth?: number
  }
): FormConfig {
  return {
    id: canvasConfig.id || "form-1",
    title: canvasConfig.title,
    description: canvasConfig.description,
    fields: fields.map(({ x, y, width, height, selected, ...field }) => ({
      ...field,
      layout: {
        ...field.layout,
        colSpan: Math.max(
          1,
          Math.min(12, Math.round((width / (canvasConfig.canvasWidth || 1200)) * 12))
        ) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
      },
    })),
    layout: canvasConfig.layout as "single" | "two-column" | "three-column" | undefined,
    gap: canvasConfig.gap,
  }
}

export function generateFormCode(
  fields: CanvasField[],
  canvasConfig: {
    id?: string
    title?: string
    description?: string
    layout?: string
    gap?: "none" | "sm" | "md" | "lg" | "xl"
  }
): string {
  const config: FormConfig = {
    id: canvasConfig.id || "form-1",
    ...canvasConfig,
    fields: fields.map(({ x, y, width, height, selected, ...field }) => field),
  }
  return `import { FormBuilder, FormConfig } from "@/components/ui/form-builder"

const formConfig: FormConfig = ${JSON.stringify(config, null, 2)}

export function MyForm() {
  const handleSubmit = async (data: Record<string, unknown>) => {
    console.log("Form data:", data)
  }

  return <FormBuilder config={formConfig} onSubmit={handleSubmit} />
}`
}
