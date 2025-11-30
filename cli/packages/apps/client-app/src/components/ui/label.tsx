import { cn } from "@/lib/utils";
import * as LabelPrimitive from "@radix-ui/react-label";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";
import { HelpHint } from "./component-registry";

export interface LabelProps
  extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>,
    VariantProps<typeof labelVariants> {
  help?: {
    content: string | React.ReactNode;
    title?: string;
  };
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<React.ElementRef<typeof LabelPrimitive.Root>, LabelProps>(
  ({ className, help, children, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), "inline-flex items-center gap-1.5", className)}
      {...props}
    >
      {children}
      {help && (
        <HelpHint
          content={help.content}
          title={help.title}
          variant="subtle"
          size="sm"
          position="inline"
        />
      )}
    </LabelPrimitive.Root>
  )
);
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
