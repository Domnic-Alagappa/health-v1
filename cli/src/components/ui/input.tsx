import * as React from "react"
import { HelpHint } from "./component-registry"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  help?: {
    content: string | React.ReactNode
    title?: string
  }
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, help, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xs border border-[#E1E4E8] bg-background px-4 py-2.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary hover:border-[#D0D6DB] transition-fluent disabled:cursor-not-allowed disabled:opacity-50",
            help && "pr-8",
            className
          )}
          ref={ref}
          {...props}
        />
        {help && (
          <HelpHint
            content={help.content}
            title={help.title}
            variant="subtle"
            size="sm"
            position="top-right"
            className="absolute right-2 top-1/2 -translate-y-1/2"
          />
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
