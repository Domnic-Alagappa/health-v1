import type { FieldLayout } from "@/components/ui/form-builder";

const spacingMap: Record<string, string> = {
  none: "0",
  sm: "2",
  md: "4",
  lg: "6",
  xl: "8",
};

export function getMarginClasses(margin?: FieldLayout["margin"]): string {
  if (!margin) return "";
  const classes: string[] = [];
  if (margin.top) classes.push(`mt-${spacingMap[margin.top] || margin.top}`);
  if (margin.bottom) classes.push(`mb-${spacingMap[margin.bottom] || margin.bottom}`);
  if (margin.left) classes.push(`ml-${spacingMap[margin.left] || margin.left}`);
  if (margin.right) classes.push(`mr-${spacingMap[margin.right] || margin.right}`);
  return classes.join(" ");
}

export function getPaddingClasses(padding?: FieldLayout["padding"]): string {
  if (!padding) return "";
  const classes: string[] = [];
  if (padding.top) classes.push(`pt-${spacingMap[padding.top] || padding.top}`);
  if (padding.bottom) classes.push(`pb-${spacingMap[padding.bottom] || padding.bottom}`);
  if (padding.left) classes.push(`pl-${spacingMap[padding.left] || padding.left}`);
  if (padding.right) classes.push(`pr-${spacingMap[padding.right] || padding.right}`);
  return classes.join(" ");
}
