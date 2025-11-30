import type { FieldType, FormField } from "@/components/ui/form-builder"

export interface CanvasField extends FormField {
  x: number // X position on canvas
  y: number // Y position on canvas
  width: number // Width in pixels
  height: number // Height in pixels
  selected?: boolean
  groupId?: string // For grouping fields
  imageUrl?: string // For image/logo fields
  borderStyle?: "solid" | "dashed" | "dotted" | "double" | "none" // Border style for boxes
  borderWidth?: number // Border width in pixels
  borderColor?: string // Border color
  lineDirection?: "horizontal" | "vertical" // For line elements
}

export interface CanvasGroup {
  id: string
  title?: string
  description?: string
  x: number
  y: number
  width: number
  height: number
  fields: string[] // Field IDs
  selected?: boolean
  collapsible?: boolean
  collapsed?: boolean
}

export interface CanvasSection {
  id: string
  title?: string
  x: number
  y: number
  width: number
  height: number
  selected?: boolean
}

export interface CanvasFormConfig {
  id?: string
  title?: string
  description?: string
  canvasWidth?: number
  canvasHeight?: number
  snapToGrid?: boolean
  gridSize?: number
  layout?: "single" | "two-column" | "three-column"
  gap?: number
}

export interface SheetSize {
  name: string
  width: number
  height: number
}

export const SHEET_SIZES: Record<string, SheetSize> = {
  a4: { name: "A4", width: 794, height: 1123 }, // 210mm × 297mm
  letter: { name: "US Letter", width: 816, height: 1056 }, // 8.5" × 11"
  legal: { name: "US Legal", width: 816, height: 1344 }, // 8.5" × 14"
  a3: { name: "A3", width: 1123, height: 1587 }, // 297mm × 420mm
  a5: { name: "A5", width: 559, height: 794 }, // 148mm × 210mm
  tabloid: { name: "Tabloid", width: 1056, height: 1632 }, // 11" × 17"
}

export interface FieldCategoryItem {
  type: FieldType | "group" | "section" | "image" | "line-horizontal" | "line-vertical" | "box"
  label: string
  icon: string
}

export interface FieldCategory {
  [category: string]: FieldCategoryItem[]
}
