import type { FieldLayout } from "@/components/ui/form-builder";

export function getAlignmentClasses(alignment?: FieldLayout["alignment"]): string {
  if (!alignment) return "";
  const classes: string[] = [];
  if (alignment.horizontal) {
    switch (alignment.horizontal) {
      case "left":
        classes.push("text-left");
        break;
      case "center":
        classes.push("text-center");
        break;
      case "right":
        classes.push("text-right");
        break;
      case "stretch":
        classes.push("w-full");
        break;
    }
  }
  if (alignment.vertical) {
    switch (alignment.vertical) {
      case "top":
        classes.push("items-start");
        break;
      case "center":
        classes.push("items-center");
        break;
      case "bottom":
        classes.push("items-end");
        break;
      case "stretch":
        classes.push("items-stretch");
        break;
    }
  }
  return classes.join(" ");
}
