/**
 * Workflow Registry
 * Registry of available workflows for LLM execution
 */

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  triggerPhrases: string[]; // Phrases that trigger this workflow
  execute: (params: Record<string, unknown>) => Promise<WorkflowResult>;
  requiredComponents?: string[]; // Component IDs required for this workflow
}

export interface WorkflowResult {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  error?: string;
}

class WorkflowRegistry {
  private workflows: Map<string, WorkflowDefinition> = new Map();

  public register(workflow: WorkflowDefinition): void {
    this.workflows.set(workflow.id, workflow);
  }

  public get(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  public getAll(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  public findByTrigger(phrase: string): WorkflowDefinition | null {
    const normalizedPhrase = phrase.toLowerCase().trim();

    for (const workflow of this.workflows.values()) {
      for (const trigger of workflow.triggerPhrases) {
        if (normalizedPhrase.includes(trigger.toLowerCase())) {
          return workflow;
        }
      }
    }

    return null;
  }

  public unregister(id: string): void {
    this.workflows.delete(id);
  }
}

// Global instance
export const workflowRegistry = new WorkflowRegistry();

// Register default workflows
workflowRegistry.register({
  id: "fill-form",
  name: "Fill Form",
  description: "Conversational form filling workflow",
  triggerPhrases: [
    "fill form",
    "fill the form",
    "fill this form",
    "complete form",
    "fill out form",
  ],
  execute: async (params) => {
    // This will be implemented by formFillingWorkflow
    return { success: true, message: "Form filling workflow started" };
  },
});

workflowRegistry.register({
  id: "create-patient",
  name: "Create Patient",
  description: "Create a new patient record",
  triggerPhrases: ["create patient", "new patient", "add patient", "register patient"],
  execute: async (params) => {
    return { success: true, message: "Patient creation workflow started" };
  },
});

workflowRegistry.register({
  id: "schedule-appointment",
  name: "Schedule Appointment",
  description: "Schedule a patient appointment",
  triggerPhrases: ["schedule appointment", "book appointment", "create appointment"],
  execute: async (params) => {
    return { success: true, message: "Appointment scheduling workflow started" };
  },
});
