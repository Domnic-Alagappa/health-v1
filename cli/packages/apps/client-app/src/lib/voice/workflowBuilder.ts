/**
 * Workflow Builder
 * LLM-powered dynamic workflow creation
 * Discovers actions from component registry and builds workflows on-the-fly
 */

import { getComponentConfig } from "@/components/ui/component-registry"
import { getTranslation } from "@/lib/i18n/i18n"
import { useAccessibilityStore } from "@/stores/accessibilityStore"
import { type ActionMetadata, getActionExecutor } from "./actionExecutor"
import { type WorkflowDefinition, type WorkflowResult, workflowRegistry } from "./workflowRegistry"

export interface WorkflowContext {
  currentPage?: string
  activeComponents?: string[]
  userHistory?: Array<{ action: string; timestamp: number }>
  componentState?: Record<string, unknown>
  locale?: string
}

export interface WorkflowStep {
  id: string
  type: "action" | "condition" | "loop" | "wait" | "speak"
  actionId?: string
  componentId?: string
  params?: Record<string, unknown>
  condition?: string
  message?: string
  nextStepId?: string
  onErrorStepId?: string
}

export interface BuiltWorkflow extends WorkflowDefinition {
  steps: WorkflowStep[]
  estimatedDuration?: number
  requiredPermissions?: string[]
}

export class WorkflowBuilder {
  private actionExecutor = getActionExecutor()
  private apiKey: string | null = null
  private apiEndpoint: string = "https://api.openai.com/v1/chat/completions"
  private model: string = "gpt-4"

  constructor() {
    // API key should come from environment or user settings
    this.apiKey =
      import.meta.env.VITE_OPENAI_API_KEY ||
      import.meta.env.VITE_ANTHROPIC_API_KEY ||
      import.meta.env.VITE_OPENROUTER_API_KEY ||
      null
  }

  /**
   * Build workflow from user command using LLM
   */
  public async buildWorkflowFromCommand(
    userCommand: string,
    context?: WorkflowContext
  ): Promise<BuiltWorkflow> {
    const locale = context?.locale || "en"
    const availableActions = this.discoverAvailableActions(locale)
    const componentsWithActions = this.actionExecutor.getComponentsWithActions()

    // Build context for LLM
    const llmContext = {
      userCommand,
      availableActions,
      componentsWithActions: componentsWithActions.map((c) => ({
        componentId: c.componentId,
        description: c.config.voiceDescription,
        structure: c.config.componentStructure,
        actions: c.actions,
      })),
      currentPage: context?.currentPage,
      activeComponents: context?.activeComponents,
      locale,
    }

    // Call LLM to build workflow
    const workflowSteps = await this.createWorkflowStepsWithLLM(llmContext)

    // Create workflow definition
    const workflow: BuiltWorkflow = {
      id: `workflow-${Date.now()}`,
      name: `Workflow for: ${userCommand}`,
      description: `LLM-generated workflow for command: ${userCommand}`,
      triggerPhrases: [userCommand],
      steps: workflowSteps,
      execute: async (params) => {
        return await this.executeWorkflowSteps(workflowSteps, params, context)
      },
    }

    // Validate workflow
    const validation = this.validateWorkflow(workflow)
    if (!validation.valid) {
      throw new Error(`Workflow validation failed: ${validation.errors.join(", ")}`)
    }

    return workflow
  }

  /**
   * Discover available actions for LLM
   */
  public discoverAvailableActions(locale: string = "en"): ActionMetadata[] {
    return this.actionExecutor.getActionMetadata(locale)
  }

  /**
   * Create workflow steps using LLM
   */
  private async createWorkflowStepsWithLLM(context: {
    userCommand: string
    availableActions: ActionMetadata[]
    componentsWithActions: Array<{
      componentId: string
      description?: string
      structure?: unknown
      actions: ActionMetadata[]
    }>
    currentPage?: string
    locale: string
  }): Promise<WorkflowStep[]> {
    if (!this.apiKey) {
      // Fallback to rule-based workflow creation
      return this.createWorkflowStepsFallback(context)
    }

    try {
      const prompt = this.buildLLMPrompt(context)

      const response = await fetch(this.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "system",
              content: `You are an advanced workflow builder for a healthcare application. 
Analyze the user's command and available actions to create a step-by-step workflow.
You have access to all registered actions from the component registry.
Create a JSON workflow with steps that execute actions in the correct order.
Each step should have: id, type, actionId, componentId, params (optional), nextStepId (optional).
Available action types: 'action', 'condition', 'loop', 'wait', 'speak'.
Return ONLY valid JSON array of workflow steps.`,
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" },
        }),
      })

      if (!response.ok) {
        throw new Error(`LLM API error: ${response.statusText}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content || ""

      // Parse LLM response
      const parsed = JSON.parse(content)
      return parsed.steps || this.createWorkflowStepsFallback(context)
    } catch (error) {
      console.error("LLM workflow creation error:", error)
      return this.createWorkflowStepsFallback(context)
    }
  }

  /**
   * Build LLM prompt with context
   */
  private buildLLMPrompt(context: {
    userCommand: string
    availableActions: ActionMetadata[]
    componentsWithActions: Array<{
      componentId: string
      description?: string
      structure?: unknown
      actions: ActionMetadata[]
    }>
    currentPage?: string
    locale: string
  }): string {
    const actionsDescription = context.availableActions
      .map(
        (action) =>
          `- ${action.label} (ID: ${action.id}, Component: ${action.componentId}, Commands: ${action.voiceCommands.join(", ")})`
      )
      .join("\n")

    const componentsDescription = context.componentsWithActions
      .map(
        (comp) =>
          `Component: ${comp.componentId}\n  Description: ${comp.description || "N/A"}\n  Actions: ${comp.actions.map((a) => a.label).join(", ")}`
      )
      .join("\n\n")

    return `User Command: "${context.userCommand}"
Current Page: ${context.currentPage || "Unknown"}
Locale: ${context.locale}

Available Actions:
${actionsDescription}

Available Components:
${componentsDescription}

Create a workflow that accomplishes the user's command. 
Use the available actions to build a step-by-step workflow.
Return JSON in format: { "steps": [ { "id": "step1", "type": "action", "actionId": "...", "componentId": "...", ... }, ... ] }`
  }

  /**
   * Fallback workflow creation (rule-based)
   */
  private createWorkflowStepsFallback(context: {
    userCommand: string
    availableActions: ActionMetadata[]
  }): WorkflowStep[] {
    const normalizedCommand = context.userCommand.toLowerCase()
    const steps: WorkflowStep[] = []

    // Try to find matching action
    const match = this.actionExecutor.findActionByCommand(context.userCommand)
    if (match) {
      steps.push({
        id: "step1",
        type: "action",
        actionId: match.action.id,
        componentId: match.componentId,
      })
    } else {
      // Generic workflow
      steps.push({
        id: "step1",
        type: "speak",
        message: `I understand you want to: ${context.userCommand}. Let me help you with that.`,
      })
    }

    return steps
  }

  /**
   * Validate workflow before execution
   */
  public validateWorkflow(workflow: BuiltWorkflow): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!workflow.steps || workflow.steps.length === 0) {
      errors.push("Workflow has no steps")
    }

    for (const step of workflow.steps) {
      if (step.type === "action") {
        if (!step.actionId || !step.componentId) {
          errors.push(`Step ${step.id} is missing actionId or componentId`)
        } else {
          const isValid = this.actionExecutor.validateAction(step.actionId, step.componentId)
          if (!isValid) {
            errors.push(
              `Step ${step.id}: Action ${step.actionId} is not valid for component ${step.componentId}`
            )
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Optimize workflow using LLM
   */
  public async optimizeWorkflow(workflow: BuiltWorkflow): Promise<BuiltWorkflow> {
    // For now, return as-is
    // Could be enhanced with LLM optimization
    return workflow
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflowSteps(
    steps: WorkflowStep[],
    params: Record<string, unknown>,
    context?: WorkflowContext
  ): Promise<WorkflowResult> {
    try {
      for (const step of steps) {
        switch (step.type) {
          case "action":
            if (step.actionId && step.componentId) {
              const result = await this.actionExecutor.executeAction(
                step.actionId,
                step.componentId,
                { ...params, ...step.params }
              )
              if (!result.success) {
                return {
                  success: false,
                  error: result.error || "Action execution failed",
                }
              }
            }
            break

          case "speak":
            if (step.message) {
              // Use text-to-speech if available
              const preferences = useAccessibilityStore.getState().preferences
              if (preferences.voiceCommandsFeedback) {
                // Would use TTS here
                console.log("Speak:", step.message)
              }
            }
            break

          case "wait":
            // Wait for specified time
            await new Promise((resolve) =>
              setTimeout(resolve, (step.params?.duration as number) || 1000)
            )
            break

          case "condition":
            // Evaluate condition (simplified)
            if (step.condition) {
              // Would evaluate condition here
              // For now, continue
            }
            break
        }
      }

      return {
        success: true,
        message: "Workflow executed successfully",
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}

// Global instance
let builderInstance: WorkflowBuilder | null = null

export function getWorkflowBuilder(): WorkflowBuilder {
  if (!builderInstance) {
    builderInstance = new WorkflowBuilder()
  }
  return builderInstance
}
