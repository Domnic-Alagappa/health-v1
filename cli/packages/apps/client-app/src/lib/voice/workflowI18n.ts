/**
 * Workflow i18n Support
 * Internationalization for workflows and LLM interactions
 */

import type { ActionItem } from "@/components/ui/component-registry"
import { getTranslation } from "@/lib/i18n/i18n"
import type { WorkflowStep } from "./workflowBuilder"

/**
 * Translate action label using i18n
 */
export function translateActionLabel(action: ActionItem, locale: string): string {
  if (action.i18nKey) {
    try {
      const translated = getTranslation(locale, action.i18nKey as any)
      if (translated !== action.i18nKey) {
        return translated
      }
    } catch {
      // Fallback to original label
    }
  }
  return action.label
}

/**
 * Get LLM prompt in user's language
 */
export function getWorkflowPrompt(locale: string): string {
  const prompts: Record<string, string> = {
    en: `You are an advanced workflow builder for a healthcare application.
Analyze the user's command and available actions to create a step-by-step workflow.
Use the available actions to build workflows that accomplish the user's goals.`,
    es: `Eres un constructor de flujos de trabajo avanzado para una aplicación de atención médica.
Analiza el comando del usuario y las acciones disponibles para crear un flujo de trabajo paso a paso.
Usa las acciones disponibles para construir flujos de trabajo que logren los objetivos del usuario.`,
    fr: `Vous êtes un constructeur de flux de travail avancé pour une application de soins de santé.
Analysez la commande de l'utilisateur et les actions disponibles pour créer un flux de travail étape par étape.
Utilisez les actions disponibles pour créer des flux de travail qui atteignent les objectifs de l'utilisateur.`,
  }

  return prompts[locale] || prompts.en
}

/**
 * Translate workflow step for user display
 */
export function translateWorkflowStep(step: WorkflowStep, locale: string): string {
  if (step.type === "speak" && step.message) {
    // Could translate message here if needed
    return step.message
  }

  if (step.type === "action" && step.actionId) {
    // Would look up action and translate its label
    return `Execute action: ${step.actionId}`
  }

  return `Step: ${step.type}`
}

/**
 * Get description of available actions for LLM in user's language
 */
export function getAvailableActionsDescription(
  actions: Array<{ id: string; label: string; i18nKey?: string; voiceCommands: string[] }>,
  locale: string
): string {
  const actionDescriptions = actions
    .map((action) => {
      const label = action.i18nKey
        ? getTranslation(locale, action.i18nKey as any) || action.label
        : action.label

      return `- ${label} (ID: ${action.id}, Commands: ${action.voiceCommands.join(", ")})`
    })
    .join("\n")

  return `Available Actions:\n${actionDescriptions}`
}

/**
 * Get component structure description for LLM in user's language
 */
export function getComponentStructureDescription(structure: unknown, locale: string): string {
  if (!structure || typeof structure !== "object") {
    return "No structure available"
  }

  const struct = structure as {
    type?: string
    fields?: Array<{ id: string; label: string; type: string }>
    actions?: Array<{ id: string; label: string }>
    sections?: Array<{ id: string; label: string }>
  }

  let description = `Component Type: ${struct.type || "unknown"}\n`

  if (struct.fields && struct.fields.length > 0) {
    description += `Fields:\n${struct.fields.map((f) => `  - ${f.label} (${f.type})`).join("\n")}\n`
  }

  if (struct.actions && struct.actions.length > 0) {
    description += `Actions:\n${struct.actions.map((a) => `  - ${a.label}`).join("\n")}\n`
  }

  if (struct.sections && struct.sections.length > 0) {
    description += `Sections:\n${struct.sections.map((s) => `  - ${s.label}`).join("\n")}\n`
  }

  return description
}

/**
 * Translate error message for user
 */
export function translateErrorMessage(error: string, locale: string): string {
  const errorMessages: Record<string, Record<string, string>> = {
    en: {
      action_not_found: "Action not found",
      component_not_found: "Component not found",
      workflow_failed: "Workflow execution failed",
      invalid_step: "Invalid workflow step",
    },
    es: {
      action_not_found: "Acción no encontrada",
      component_not_found: "Componente no encontrado",
      workflow_failed: "La ejecución del flujo de trabajo falló",
      invalid_step: "Paso de flujo de trabajo inválido",
    },
    fr: {
      action_not_found: "Action introuvable",
      component_not_found: "Composant introuvable",
      workflow_failed: "L'exécution du flux de travail a échoué",
      invalid_step: "Étape de flux de travail invalide",
    },
  }

  return errorMessages[locale]?.[error] || errorMessages.en[error] || error
}
