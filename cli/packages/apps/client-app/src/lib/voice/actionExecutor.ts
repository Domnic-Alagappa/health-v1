/**
 * Action Executor
 * Clean class-based system for discovering and executing registered actions
 * Works with component registry to discover actions dynamically
 */

import {
  type ActionItem,
  type ComponentConfig,
  getAllActionItems,
  getComponentConfig,
  getVoiceInteractableComponents,
} from "@/components/ui/component-registry"
import { getTranslation } from "@/lib/i18n/i18n"
import { useAccessibilityStore } from "@/stores/accessibilityStore"

export interface ActionMetadata {
  id: string
  componentId: string
  label: string
  i18nKey?: string
  voiceCommands: string[]
  confirmationRequired?: boolean
  description?: string
  componentStructure?: unknown
}

export interface ActionMatch {
  action: ActionItem
  componentId: string
  componentConfig: ComponentConfig
  confidence: number
  matchedCommand: string
}

export interface ActionResult {
  success: boolean
  message?: string
  error?: string
  data?: Record<string, unknown>
}

export class ActionExecutor {
  /**
   * Discover all registered actions from component registry
   */
  public discoverAllActions(): ActionMetadata[] {
    const allActions = getAllActionItems()
    const metadata: ActionMetadata[] = []

    for (const { componentId, action } of allActions) {
      const componentConfig = getComponentConfig(componentId)

      metadata.push({
        id: action.id,
        componentId,
        label: action.label,
        i18nKey: action.i18nKey,
        voiceCommands: Array.isArray(action.voiceCommand)
          ? action.voiceCommand
          : action.voiceCommand
            ? [action.voiceCommand]
            : [],
        confirmationRequired: action.confirmationRequired,
        description: componentConfig?.voiceDescription,
        componentStructure: componentConfig?.componentStructure,
      })
    }

    return metadata
  }

  /**
   * Find action matching voice command
   */
  public findActionByCommand(command: string): ActionMatch | null {
    const normalizedCommand = command.toLowerCase().trim()
    const allActions = getAllActionItems()

    let bestMatch: ActionMatch | null = null
    let highestConfidence = 0

    for (const { componentId, action } of allActions) {
      const componentConfig = getComponentConfig(componentId)
      if (!componentConfig) continue

      // Check voice commands
      if (action.voiceCommand) {
        const commands = Array.isArray(action.voiceCommand)
          ? action.voiceCommand
          : [action.voiceCommand]

        for (const cmd of commands) {
          const normalizedCmd = cmd.toLowerCase()
          let confidence = 0

          // Exact match
          if (normalizedCommand === normalizedCmd) {
            confidence = 1.0
          }
          // Contains match
          else if (
            normalizedCommand.includes(normalizedCmd) ||
            normalizedCmd.includes(normalizedCommand)
          ) {
            confidence = 0.8
          }
          // Partial match
          else if (normalizedCommand.split(" ").some((word) => normalizedCmd.includes(word))) {
            confidence = 0.6
          }

          if (confidence > highestConfidence) {
            highestConfidence = confidence
            bestMatch = {
              action,
              componentId,
              componentConfig,
              confidence,
              matchedCommand: cmd,
            }
          }
        }
      }

      // Also check label match
      const normalizedLabel = action.label.toLowerCase()
      let labelConfidence = 0

      if (normalizedCommand === normalizedLabel) {
        labelConfidence = 0.9
      } else if (
        normalizedCommand.includes(normalizedLabel) ||
        normalizedLabel.includes(normalizedCommand)
      ) {
        labelConfidence = 0.7
      }

      if (labelConfidence > highestConfidence) {
        highestConfidence = labelConfidence
        bestMatch = {
          action,
          componentId,
          componentConfig,
          confidence: labelConfidence,
          matchedCommand: action.label,
        }
      }
    }

    return bestMatch && highestConfidence >= 0.6 ? bestMatch : null
  }

  /**
   * Execute a registered action
   */
  public async executeAction(
    actionId: string,
    componentId: string,
    params?: Record<string, unknown>
  ): Promise<ActionResult> {
    try {
      const componentConfig = getComponentConfig(componentId)
      if (!componentConfig || !componentConfig.actionItems) {
        return {
          success: false,
          error: `Component ${componentId} not found or has no actions`,
        }
      }

      const action = componentConfig.actionItems.find((a) => a.id === actionId)
      if (!action) {
        return {
          success: false,
          error: `Action ${actionId} not found in component ${componentId}`,
        }
      }

      // Check if confirmation is required
      if (action.confirmationRequired) {
        // In a real implementation, this would show a confirmation dialog
        // For now, we'll proceed (could be enhanced with user confirmation)
      }

      // Execute the action
      const result = await action.action()

      return {
        success: true,
        message: `Action ${action.label} executed successfully`,
        data: params,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error executing action",
      }
    }
  }

  /**
   * Get action metadata for LLM context
   */
  public getActionMetadata(locale: string = "en"): ActionMetadata[] {
    const actions = this.discoverAllActions()

    // Enhance with translations
    return actions.map((action) => {
      let label = action.label

      // Try to translate if i18n key exists
      if (action.i18nKey) {
        try {
          const translated = getTranslation(locale, action.i18nKey as any)
          if (translated !== action.i18nKey) {
            label = translated
          }
        } catch {
          // Fallback to original label
        }
      }

      return {
        ...action,
        label,
      }
    })
  }

  /**
   * Validate if action can be executed
   */
  public validateAction(actionId: string, componentId: string): boolean {
    const componentConfig = getComponentConfig(componentId)
    if (!componentConfig || !componentConfig.actionItems) {
      return false
    }

    const action = componentConfig.actionItems.find((a) => a.id === actionId)
    if (!action) {
      return false
    }

    // Check if component is voice interactable
    if (componentConfig.voiceInteractable === false) {
      return false
    }

    return true
  }

  /**
   * Get actions for a specific component
   */
  public getActionsByComponent(componentId: string): ActionItem[] {
    const componentConfig = getComponentConfig(componentId)
    return componentConfig?.actionItems || []
  }

  /**
   * Get all components with their actions (for LLM context)
   */
  public getComponentsWithActions(): Array<{
    componentId: string
    config: ComponentConfig
    actions: ActionMetadata[]
  }> {
    const components = getVoiceInteractableComponents()

    return components.map(({ id, config }) => ({
      componentId: id,
      config,
      actions:
        config.actionItems?.map((action) => ({
          id: action.id,
          componentId: id,
          label: action.label,
          i18nKey: action.i18nKey,
          voiceCommands: Array.isArray(action.voiceCommand)
            ? action.voiceCommand
            : action.voiceCommand
              ? [action.voiceCommand]
              : [],
          confirmationRequired: action.confirmationRequired,
          description: config.voiceDescription,
          componentStructure: config.componentStructure,
        })) || [],
    }))
  }
}

// Global instance
let executorInstance: ActionExecutor | null = null

export function getActionExecutor(): ActionExecutor {
  if (!executorInstance) {
    executorInstance = new ActionExecutor()
  }
  return executorInstance
}
