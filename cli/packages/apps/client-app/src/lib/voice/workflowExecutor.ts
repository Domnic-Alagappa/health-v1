/**
 * Workflow Executor
 * Execute workflows via LLM or direct execution
 */

import { useVoiceCommandStore } from "@/stores/voiceCommandStore"
import { getActionExecutor } from "./actionExecutor"
import { getVoiceCommandExecutor } from "./voiceCommandExecutor"
import type { BuiltWorkflow, WorkflowStep } from "./workflowBuilder"
import { type WorkflowDefinition, type WorkflowResult, workflowRegistry } from "./workflowRegistry"

export class WorkflowExecutor {
  private actionExecutor = getActionExecutor()

  public async executeWorkflow(
    workflowId: string,
    params: Record<string, unknown> = {}
  ): Promise<WorkflowResult> {
    const workflow = workflowRegistry.get(workflowId)

    if (!workflow) {
      return {
        success: false,
        error: `Workflow ${workflowId} not found`,
      }
    }

    try {
      return await workflow.execute(params)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  public async findAndExecuteWorkflow(command: string): Promise<WorkflowResult> {
    const workflow = workflowRegistry.findByTrigger(command)

    if (!workflow) {
      return {
        success: false,
        error: "No matching workflow found",
      }
    }

    return await this.executeWorkflow(workflow.id)
  }

  public getAvailableWorkflows(): WorkflowDefinition[] {
    return workflowRegistry.getAll()
  }

  /**
   * Execute LLM-created dynamic workflow
   */
  public async executeDynamicWorkflow(
    workflow: BuiltWorkflow,
    params: Record<string, unknown> = {}
  ): Promise<WorkflowResult> {
    try {
      useVoiceCommandStore.getState().setCurrentWorkflow({
        type: "dynamic",
        step: 0,
        data: { workflowId: workflow.id, steps: workflow.steps },
      })

      return await workflow.execute(params)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Execute individual workflow step
   */
  public async executeWorkflowStep(
    step: WorkflowStep,
    context: Record<string, unknown> = {}
  ): Promise<{ success: boolean; error?: string; data?: unknown }> {
    try {
      switch (step.type) {
        case "action":
          if (step.actionId && step.componentId) {
            const result = await this.actionExecutor.executeAction(
              step.actionId,
              step.componentId,
              { ...context, ...step.params }
            )

            if (!result.success) {
              return {
                success: false,
                error: result.error,
              }
            }

            return {
              success: true,
              data: result.data,
            }
          }
          break

        case "speak":
          if (step.message) {
            // Would use TTS here
            console.log("Speak:", step.message)
          }
          return { success: true }

        case "wait": {
          const duration = (step.params?.duration as number) || 1000
          await new Promise((resolve) => setTimeout(resolve, duration))
          return { success: true }
        }

        case "condition":
          // Evaluate condition (simplified)
          if (step.condition) {
            // Would evaluate condition here
            // For now, continue
          }
          return { success: true }

        default:
          return {
            success: false,
            error: `Unknown step type: ${step.type}`,
          }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  /**
   * Handle workflow error with recovery
   */
  public handleWorkflowError(error: Error, workflow: WorkflowDefinition): WorkflowResult {
    // Log error
    console.error("Workflow error:", error)

    // Try to recover or provide helpful error message
    return {
      success: false,
      error: error.message || "Workflow execution failed",
      message: `Workflow "${workflow.name}" encountered an error. Please try again.`,
    }
  }
}

// Global instance
let executorInstance: WorkflowExecutor | null = null

export function getWorkflowExecutor(): WorkflowExecutor {
  if (!executorInstance) {
    executorInstance = new WorkflowExecutor()
  }
  return executorInstance
}
