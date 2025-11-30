import type { FieldType } from "@/components/ui/form-builder"
import type { FieldCategory } from "./types"

export const FIELD_CATEGORIES: FieldCategory = {
  "Field Elements": [
    { type: "text" as FieldType, label: "Input", icon: "📝" },
    { type: "textarea" as FieldType, label: "Textarea", icon: "📄" },
    { type: "email" as FieldType, label: "Email", icon: "✉️" },
    { type: "number" as FieldType, label: "Number", icon: "🔢" },
    { type: "date" as FieldType, label: "Date", icon: "📅" },
    { type: "select" as FieldType, label: "Select", icon: "📋" },
    { type: "checkbox" as FieldType, label: "Checkbox", icon: "☐" },
    { type: "radio" as FieldType, label: "Radio", icon: "🔘" },
    { type: "file" as FieldType, label: "File", icon: "📎" },
  ],
  "Display Elements": [
    { type: "display-text" as FieldType, label: "Text", icon: "📝" },
    { type: "separator" as FieldType, label: "Separator", icon: "➖" },
    { type: "image" as any, label: "Image/Logo", icon: "🖼️" },
  ],
  "Shapes & Lines": [
    { type: "line-horizontal" as any, label: "Horizontal Line", icon: "➖" },
    { type: "line-vertical" as any, label: "Vertical Line", icon: "|" },
    { type: "box" as any, label: "Box", icon: "▦" },
  ],
  Containers: [
    { type: "group" as any, label: "Group", icon: "📦" },
    { type: "section" as any, label: "Section", icon: "📑" },
  ],
}
