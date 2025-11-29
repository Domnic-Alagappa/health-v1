import * as React from "react"
import { cn } from "@/lib/utils"
import { HoverHelp } from "./hover-help"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  help?: {
    content: string | React.ReactNode
    title?: string
  }
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      help,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      placeholder,
      ...props
    },
    ref
  ) => {
    const helpId = help ? `help-${Math.random().toString(36).substring(2, 9)}` : undefined

    // Generate ARIA label from placeholder if not provided
    const inputAriaLabel = ariaLabel || placeholder

    return (
      <div className="relative w-full group">
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-xs border border-[#E1E4E8] bg-background px-4 py-2.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary hover:border-[#D0D6DB] transition-fluent disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive",
            className
          )}
          ref={ref}
          aria-label={inputAriaLabel}
          aria-describedby={helpId || ariaDescribedBy}
          aria-required={props.required}
          placeholder={placeholder}
          {...props}
        />
        {help && (
          <HoverHelp
            content={help.content}
            title={help.title}
            position="top-right"
            className="mt-1.5"
          />
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
