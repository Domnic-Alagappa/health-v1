import type { CanvasField } from "@/components/forms/canvas/types"
import type { FieldType } from "@/components/ui/form-builder"

export function createCanvasField(
  type: FieldType | "image" | "line-horizontal" | "line-vertical" | "box",
  index: number,
  _canvasWidth?: number
): CanvasField {
  if (type === "image") {
    return {
      id: `field-${Date.now()}`,
      name: `image${index + 1}`,
      label: "Image/Logo",
      type: "display-text",
      x: 50 + (index % 5) * 200,
      y: 50 + Math.floor(index / 5) * 100,
      width: 200,
      height: 100,
      imageUrl: "",
    }
  }

  if (type === "line-horizontal") {
    return {
      id: `field-${Date.now()}`,
      name: `line${index + 1}`,
      label: "",
      type: "separator",
      x: 50 + (index % 5) * 200,
      y: 50 + Math.floor(index / 5) * 100,
      width: 400,
      height: 2,
      lineDirection: "horizontal",
      borderWidth: 1,
      borderColor: "#1C1C1E",
    }
  }

  if (type === "line-vertical") {
    return {
      id: `field-${Date.now()}`,
      name: `line${index + 1}`,
      label: "",
      type: "separator",
      x: 50 + (index % 5) * 200,
      y: 50 + Math.floor(index / 5) * 100,
      width: 2,
      height: 200,
      lineDirection: "vertical",
      borderWidth: 1,
      borderColor: "#1C1C1E",
    }
  }

  if (type === "box") {
    return {
      id: `field-${Date.now()}`,
      name: `box${index + 1}`,
      label: "",
      type: "display-text",
      x: 50 + (index % 5) * 200,
      y: 50 + Math.floor(index / 5) * 100,
      width: 200,
      height: 150,
      borderStyle: "solid",
      borderWidth: 1,
      borderColor: "#1C1C1E",
    }
  }

  return {
    id: `field-${Date.now()}`,
    name: `field${index + 1}`,
    label:
      type === "separator" ? "" : type === "display-text" ? "Display Text" : `Field ${index + 1}`,
    type,
    x: 50 + (index % 5) * 200,
    y: 50 + Math.floor(index / 5) * 100,
    width: type === "textarea" ? 300 : type === "separator" ? 400 : 200,
    height: type === "textarea" ? 100 : type === "separator" ? 2 : 40,
    placeholder: type !== "separator" && type !== "display-text" ? `Enter ${type}...` : undefined,
    layout: {
      colSpan: 12,
      size: "md",
    },
  }
}
