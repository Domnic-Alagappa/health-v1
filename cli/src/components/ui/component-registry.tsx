import * as React from "react"
import { HelpButton, HelpButtonProps } from "./help-button"

/**
 * Component Registry - Centralized component configuration and customization
 * This allows for consistent hint/help buttons and component customization across the app
 */

export interface ComponentConfig {
  readonly showHelp?: boolean
  readonly helpContent?: string | React.ReactNode
  readonly helpTitle?: string
  readonly helpVariant?: HelpButtonProps["variant"]
  readonly helpSize?: HelpButtonProps["size"]
  readonly className?: string
  readonly customizations?: Readonly<Record<string, unknown>>
}

export interface ComponentWithHelpProps {
  help?: {
    content: string | React.ReactNode
    title?: string
    variant?: HelpButtonProps["variant"]
    size?: HelpButtonProps["size"]
  }
  className?: string
  children?: React.ReactNode
}

/**
 * Higher-order component wrapper that adds help button to any component
 */
export function withHelp<T extends Readonly<Record<string, unknown>>>(
  Component: React.ComponentType<T>,
  defaultHelp?: ComponentConfig["helpContent"]
) {
  return function ComponentWithHelp({
    help,
    className,
    children,
    ...props
  }: T & ComponentWithHelpProps) {
    const helpContent = help?.content || defaultHelp
    const showHelp = helpContent !== undefined

    return (
      <div className={cn("relative group", className)}>
        {children || <Component {...(props as T)} />}
        {showHelp && (
          <div className="absolute top-0 right-0 -mt-1 -mr-1">
            <HelpButton
              content={helpContent}
              title={help?.title}
              variant={help?.variant || "default"}
              size={help?.size || "md"}
            />
          </div>
        )}
      </div>
    )
  }
}

export type HelpHintPosition = "top-right" | "top-left" | "bottom-right" | "bottom-left" | "inline"

export interface HelpHintProps {
  readonly content: string | React.ReactNode
  readonly title?: string
  readonly variant?: HelpButtonProps["variant"]
  readonly size?: HelpButtonProps["size"]
  readonly position?: HelpHintPosition
  readonly className?: string
}

/**
 * Helper function to create a help button positioned relative to a component
 */
export function HelpHint({
  content,
  title,
  variant = "default",
  size = "md",
  position = "top-right",
  className,
}: HelpHintProps) {
  const positionClasses = {
    "top-right": "absolute top-0 right-0 -mt-1 -mr-1",
    "top-left": "absolute top-0 left-0 -mt-1 -ml-1",
    "bottom-right": "absolute bottom-0 right-0 -mb-1 -mr-1",
    "bottom-left": "absolute bottom-0 left-0 -mb-1 -ml-1",
    inline: "inline-flex ml-1.5",
  }

  return (
    <span className={cn(positionClasses[position], className)}>
      <HelpButton content={content} title={title} variant={variant} size={size} />
    </span>
  )
}

// Component Registry - Store component configurations
export const componentRegistry = new Map<string, ComponentConfig>()

/**
 * Register a component configuration
 */
export function registerComponent(name: string, config: ComponentConfig) {
  componentRegistry.set(name, config)
}

/**
 * Get component configuration
 */
export function getComponentConfig(name: string): ComponentConfig | undefined {
  return componentRegistry.get(name)
}

/**
 * Wrapper component that adds help to form fields, cards, etc.
 */
export function ComponentWrapper({
  name,
  children,
  help,
  className,
  ...props
}: {
  name?: string
  children: React.ReactNode
  help?: ComponentWithHelpProps["help"]
  className?: string
} & React.HTMLAttributes<HTMLDivElement>) {
  const config = name ? getComponentConfig(name) : undefined
  const helpContent = help?.content || config?.helpContent
  const helpTitle = help?.title || config?.helpTitle

  return (
    <div className={cn("relative", className)} {...props}>
      {children}
      {helpContent && (
        <HelpHint
          content={helpContent}
          title={helpTitle}
          variant={help?.variant || config?.helpVariant || "default"}
          size={help?.size || config?.helpSize || "md"}
          position="top-right"
        />
      )}
    </div>
  )
}

function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ")
}

