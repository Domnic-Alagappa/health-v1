import { cn } from "@/lib/utils";
import * as React from "react";
import { Box } from "./box";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "lg", ...props }, ref) => {
    const sizeClasses = {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      xl: "max-w-screen-xl",
      full: "max-w-full",
    };

    return (
      <Box
        ref={ref}
        className={cn(
          size === "full" ? "w-full" : "mx-auto",
          size !== "full" && "px-4",
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Container.displayName = "Container";

export { Container };
