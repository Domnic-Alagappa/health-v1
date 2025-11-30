import type { FieldLayout } from "@/components/ui/form-builder";

export function getWidthClasses(width?: FieldLayout["width"]): string {
  if (!width) return "w-full";
  switch (width) {
    case "full":
      return "w-full";
    case "half":
      return "w-1/2";
    case "third":
      return "w-1/3";
    case "quarter":
      return "w-1/4";
    case "auto":
      return "w-auto";
    default:
      return width; // Custom width class
  }
}
