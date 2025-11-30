import type * as React from "react"
import { HelpButton, type HelpButtonProps } from "./help-button"
import { cn } from "../lib/utils"
import type {
  ActionItem,
  ComponentStructure,
  FieldStructure,
  OptionStructure,
  ColumnStructure,
  RowStructure,
  ActionStructure,
  SectionStructure,
  DataPointStructure,
  ValidationRules,
  ComponentConfig as SharedComponentConfig,
} from "@health-v1/shared/types/components/registry"

/**
 * Component Registry - Centralized component configuration and customization
 * This allows for consistent hint/help buttons and component customization across the app
 */

// Re-export types from shared
export type {
  ActionItem,
  ComponentStructure,
  FieldStructure,
  OptionStructure,
  ColumnStructure,
  RowStructure,
  ActionStructure,
  SectionStructure,
  DataPointStructure,
  ValidationRules,
}

// Extend ComponentConfig to include HelpButtonProps types
export interface ComponentConfig extends Omit<SharedComponentConfig, "helpVariant" | "helpSize"> {
  readonly helpVariant?: HelpButtonProps["variant"]
  readonly helpSize?: HelpButtonProps["size"]
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
  readonly id?: string
  readonly "aria-label"?: string
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
  id,
  "aria-label": ariaLabel,
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
      <HelpButton
        content={content}
        title={title}
        variant={variant}
        size={size}
        id={id}
        aria-label={ariaLabel}
      />
    </span>
  )
}

// Component Registry - Store component configurations
export const componentRegistry = new Map<string, ComponentConfig>()

/**
 * Get all voice-interactable components
 */
export function getVoiceInteractableComponents(): Array<{ id: string; config: ComponentConfig }> {
  return Array.from(componentRegistry.entries())
    .filter(([_, config]) => config.voiceInteractable !== false)
    .map(([id, config]) => ({ id, config }))
}

/**
 * Find component by voice command
 */
export function findComponentByVoiceCommand(command: string): ComponentConfig | null {
  const normalizedCommand = command.toLowerCase().trim()

  for (const config of componentRegistry.values()) {
    if (config.actionItems) {
      for (const action of config.actionItems) {
        if (action.voiceCommand) {
          const commands = Array.isArray(action.voiceCommand)
            ? action.voiceCommand
            : [action.voiceCommand]
          for (const cmd of commands) {
            if (normalizedCommand.includes(cmd.toLowerCase())) {
              return config
            }
          }
        }
      }
    }
  }

  return null
}

/**
 * Get all action items from all components
 */
export function getAllActionItems(): Array<{ componentId: string; action: ActionItem }> {
  const actions: Array<{ componentId: string; action: ActionItem }> = []

  for (const [componentId, config] of componentRegistry.entries()) {
    if (config.actionItems) {
      for (const action of config.actionItems) {
        actions.push({ componentId, action })
      }
    }
  }

  return actions
}

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
 * Get all actions with full metadata including i18n
 */
export function getAllActionsWithMetadata(): Array<{
  componentId: string
  action: ActionItem
  config: ComponentConfig
}> {
  const actions: Array<{ componentId: string; action: ActionItem; config: ComponentConfig }> = []

  for (const [componentId, config] of componentRegistry.entries()) {
    if (config.actionItems) {
      for (const action of config.actionItems) {
        actions.push({ componentId, action, config })
      }
    }
  }

  return actions
}

/**
 * Get actions for specific component
 */
export function getActionsByComponent(componentId: string): ActionItem[] {
  const config = componentRegistry.get(componentId)
  return config?.actionItems || []
}

/**
 * Get component structure for LLM
 */
export function getComponentStructure(componentId: string): ComponentStructure | undefined {
  const config = componentRegistry.get(componentId)
  return config?.componentStructure
}

/**
 * Find actions matching voice command
 */
export function findActionsByVoiceCommand(
  command: string
): Array<{ componentId: string; action: ActionItem; config: ComponentConfig }> {
  const normalizedCommand = command.toLowerCase().trim()
  const matches: Array<{ componentId: string; action: ActionItem; config: ComponentConfig }> = []

  for (const [componentId, config] of componentRegistry.entries()) {
    if (config.actionItems) {
      for (const action of config.actionItems) {
        if (action.voiceCommand) {
          const commands = Array.isArray(action.voiceCommand)
            ? action.voiceCommand
            : [action.voiceCommand]
          for (const cmd of commands) {
            if (
              normalizedCommand.includes(cmd.toLowerCase()) ||
              cmd.toLowerCase().includes(normalizedCommand)
            ) {
              matches.push({ componentId, action, config })
              break
            }
          }
        }

        // Also check label match
        if (
          action.label.toLowerCase().includes(normalizedCommand) ||
          normalizedCommand.includes(action.label.toLowerCase())
        ) {
          if (!matches.find((m) => m.action.id === action.id && m.componentId === componentId)) {
            matches.push({ componentId, action, config })
          }
        }
      }
    }
  }

  return matches
}

// Expose registry globally for LLM context
if (typeof window !== "undefined") {
  ;(window as any).__componentRegistry = componentRegistry
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

