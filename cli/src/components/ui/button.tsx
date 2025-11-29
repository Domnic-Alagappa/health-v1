import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-button font-semibold ring-offset-background transition-fluent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-[#005BB5] shadow-fluent-1 hover:shadow-fluent-2",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-fluent-1 hover:shadow-fluent-2",
        warning: "bg-warning text-warning-foreground hover:bg-warning/90 shadow-fluent-1 hover:shadow-fluent-2",
        success: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-fluent-1 hover:shadow-fluent-2",
        info: "bg-info text-info-foreground hover:bg-info/90 shadow-fluent-1 hover:shadow-fluent-2",
        health: "bg-health text-health-foreground hover:bg-health/90 shadow-fluent-1 hover:shadow-fluent-2",
        highlight: "bg-highlight text-highlight-foreground hover:bg-highlight/90 shadow-fluent-1 hover:shadow-fluent-2",
        outline: "border border-[#E1E4E8] bg-background hover:bg-[#E9EEF3] hover:border-[#D0D6DB] hover:text-[#1C1C1E] transition-fluent",
        secondary: "bg-[#F4F6F8] text-[#1C1C1E] hover:bg-[#E9EEF3] border border-[#E1E4E8] hover:border-[#D0D6DB] shadow-fluent-1 hover:shadow-fluent-2",
        ghost: "hover:bg-accent/50 hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-sm px-4 text-small",
        lg: "h-12 rounded-sm px-8 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  help?: {
    content: string | React.ReactNode
    title?: string
  }
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
