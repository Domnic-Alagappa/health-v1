import { Slot } from "@radix-ui/react-slot"
import * as React from "react"
import { cn } from "@/lib/utils"

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
  direction?: "row" | "column" | "row-reverse" | "column-reverse"
  wrap?: boolean | "wrap" | "nowrap" | "wrap-reverse"
  spacing?: "none" | "xs" | "sm" | "md" | "lg" | "xl"
  align?: "start" | "center" | "end" | "stretch" | "baseline"
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly"
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl"
}

const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    { className, asChild = false, direction = "row", wrap, spacing, align, justify, gap, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "div"

    const directionClasses = {
      row: "flex-row",
      column: "flex-col",
      "row-reverse": "flex-row-reverse",
      "column-reverse": "flex-col-reverse",
    }

    const wrapClasses = {
      true: "flex-wrap",
      wrap: "flex-wrap",
      nowrap: "flex-nowrap",
      "wrap-reverse": "flex-wrap-reverse",
    }

    const spacingClasses = {
      none: "space-x-0 space-y-0",
      xs: "space-x-1 space-y-1",
      sm: "space-x-2 space-y-2",
      md: "space-x-4 space-y-4",
      lg: "space-x-6 space-y-6",
      xl: "space-x-8 space-y-8",
    }

    const gapClasses = {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
    }

    const alignClasses = {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    }

    const justifyClasses = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    }

    return (
      <Comp
        ref={ref}
        className={cn(
          "flex",
          directionClasses[direction],
          wrap !== undefined && wrapClasses[wrap as keyof typeof wrapClasses],
          spacing && spacingClasses[spacing],
          gap && gapClasses[gap],
          align && alignClasses[align],
          justify && justifyClasses[justify],
          className
        )}
        {...props}
      />
    )
  }
)
Flex.displayName = "Flex"

export { Flex }
