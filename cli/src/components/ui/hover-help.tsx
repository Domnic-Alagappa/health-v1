import { Info } from "lucide-react"
import type * as React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export interface HoverHelpProps {
  content: string | React.ReactNode
  title?: string
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  className?: string
}

/**
 * Hover help icon - appears on hover in top-right corner
 * Perfect for buttons, cards, and forms
 */
export function HoverHelp({ content, title, position = "top-right", className }: HoverHelpProps) {
  const positionClasses = {
    "top-right": "absolute top-1 right-1",
    "top-left": "absolute top-1 left-1",
    "bottom-right": "absolute bottom-1 right-1",
    "bottom-left": "absolute bottom-1 left-1",
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10",
              "inline-flex items-center justify-center rounded-full",
              "h-5 w-5 bg-white/90 dark:bg-[#2B2B2B]/90",
              "border border-[#E1E4E8] dark:border-[#3B3B3B]",
              "hover:bg-white dark:hover:bg-[#2B2B2B]",
              "shadow-fluent-1",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              positionClasses[position],
              className
            )}
            aria-label={title || "More information"}
          >
            <Info className="h-3 w-3 text-[#4A4A4E] dark:text-[#A9A9A9]" strokeWidth={2.5} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          {title && <div className="font-semibold mb-1 text-sm">{title}</div>}
          <div className="text-sm leading-relaxed">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
