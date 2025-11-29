import type { FieldLayout, FormConfig } from "@/components/ui/form-builder"

export function getGridColSpan(colSpan?: FieldLayout["colSpan"]): string {
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

export function getGridLayoutClasses(config: FormConfig): string {
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
    single: "grid-cols-1",
    "two-column": "grid-cols-1 md:grid-cols-2",
    "three-column": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "four-column": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }

  return layoutMap[config.layout || "single"] ?? layoutMap["single"]
}

export function getGapClasses(config: FormConfig): string {
  const gapMap: Record<string, string> = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
  }
  return gapMap[config.gap || "md"] ?? gapMap["md"]
}
