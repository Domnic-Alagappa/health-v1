import type { FieldLayout } from "@/components/ui/form-builder";

export function getFieldSizeClasses(size?: FieldLayout["size"]): string {
  switch (size) {
    case "sm":
      return "h-9 text-sm px-3";
    case "lg":
      return "h-12 text-base px-5";
    case "xl":
      return "h-14 text-lg px-6";
    default:
      return "h-11 text-sm px-4"; // md
  }
}
