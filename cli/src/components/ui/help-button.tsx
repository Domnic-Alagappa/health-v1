import { HelpCircle } from "lucide-react"
import * as React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface HelpButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  content: string | React.ReactNode
  title?: string
  variant?: "default" | "subtle" | "icon-only"
  size?: "sm" | "md" | "lg"
}

const HelpButton = React.forwardRef<HTMLButtonElement, HelpButtonProps>(
  ({ className, content, title, variant = "default", size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-[18px] w-[18px]",
      lg: "h-5 w-5",
    }

    const variantClasses = {
      default: "text-[#4A4A4E] hover:text-primary dark:text-[#A9A9A9] dark:hover:text-primary",
      subtle: "text-muted-foreground hover:text-foreground opacity-60 hover:opacity-100",
      "icon-only": "text-[#4A4A4E] hover:text-primary dark:text-[#A9A9A9] dark:hover:text-primary",
    }

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              ref={ref}
              type="button"
              className={cn(
                "inline-flex items-center justify-center rounded-full transition-fluent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                sizeClasses[size],
                variantClasses[variant],
                className
              )}
              aria-label={title || "Help"}
              {...props}
            >
              <HelpCircle className="h-full w-full" strokeWidth={2} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            {title && <div className="font-semibold mb-1 text-sm">{title}</div>}
            <div className="text-sm leading-relaxed">{content}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
)
HelpButton.displayName = "HelpButton"

export { HelpButton }

