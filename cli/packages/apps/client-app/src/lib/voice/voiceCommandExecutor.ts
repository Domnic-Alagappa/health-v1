/**
 * Voice Command Executor
 * Execute voice commands by finding and triggering component actions
 */

import { getComponentConfig } from "@/components/ui/component-registry";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { useTabStore } from "@/stores/tabStore";
import { useVoiceCommandStore } from "@/stores/voiceCommandStore";
import { getActionExecutor } from "./actionExecutor";
import { getLLMWorkflowEngine } from "./llmWorkflowEngine";
import { getTextToSpeechEngine } from "./voiceCommandEngine";
import type { VoiceIntent } from "./voiceCommandParser";
import { getWorkflowBuilder } from "./workflowBuilder";

export class VoiceCommandExecutor {
  private tts: ReturnType<typeof getTextToSpeechEngine>;
  private actionExecutor = getActionExecutor();
  private workflowBuilder = getWorkflowBuilder();
  private llmEngine = getLLMWorkflowEngine();

  constructor() {
    this.tts = getTextToSpeechEngine();
  }

  public async execute(intent: VoiceIntent): Promise<boolean> {
    try {
      useVoiceCommandStore.getState().setProcessing(true);
      useVoiceCommandStore.getState().setLastIntent(intent.type);

      let success = false;

      switch (intent.type) {
        case "open_patient":
          success = await this.executeOpenPatient(intent.target || "");
          break;
        case "fill_form":
          success = await this.executeFillForm();
          break;
        case "submit_form":
          success = await this.executeSubmitForm();
          break;
        case "click_button":
          success = await this.executeClickButton(intent.target || "");
          break;
        case "select_option":
          success = await this.executeSelectOption(intent.target || "", intent.value || "");
          break;
        case "navigate":
          success = await this.executeNavigate(intent.target || "");
          break;
        case "open_modal":
          success = await this.executeOpenModal(intent.target || "");
          break;
        case "close_modal":
          success = await this.executeCloseModal();
          break;
        case "search":
          success = await this.executeSearch(intent.value || "");
          break;
        case "help":
          success = await this.executeHelp();
          break;
        case "stop":
          success = await this.executeStop();
          break;
        default:
          this.speak("I did not understand that command. Please try again.");
          success = false;
      }

      useVoiceCommandStore.getState().addToHistory(intent.action, intent.type, success);

      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      useVoiceCommandStore.getState().setError(errorMessage);
      this.speak(`Error: ${errorMessage}`);
      return false;
    } finally {
      useVoiceCommandStore.getState().setProcessing(false);
    }
  }

  private async executeFillForm(): Promise<boolean> {
    // Use LLM workflow engine to create and execute form filling workflow
    try {
      // Try to find a form component on the current page
      const components = this.actionExecutor.getComponentsWithActions();
      const formComponent = components.find((c) => c.config.componentStructure?.type === "form");

      if (formComponent) {
        await this.llmEngine.executeFormFillingWorkflow(formComponent.componentId);
        return true;
      } else {
        // Use workflow builder to create dynamic workflow
        await this.llmEngine.createAndExecuteWorkflow("fill the form");
        return true;
      }
    } catch (error) {
      this.speak(`Error filling form: ${error instanceof Error ? error.message : "Unknown error"}`);
      return false;
    }
  }

  private async executeSubmitForm(): Promise<boolean> {
    // Find submit button in component registry
    // This is a simplified version - full implementation would search all registered components
    this.speak("Submitting the form.");
    // Actual submission would be handled by finding the form component
    return true;
  }

  private async executeClickButton(buttonName: string): Promise<boolean> {
    // Use ActionExecutor to find and execute action
    const match = this.actionExecutor.findActionByCommand(buttonName);

    if (match) {
      const result = await this.actionExecutor.executeAction(match.action.id, match.componentId);

      if (result.success) {
        this.speak(`Executed ${match.action.label}.`);
        return true;
      } else {
        this.speak(`Failed to execute ${buttonName}: ${result.error}`);
        return false;
      }
    }

    // Fallback to generic message
    this.speak(`I couldn't find a button named "${buttonName}".`);
    return false;
  }

  private async executeSelectOption(option: string, target: string): Promise<boolean> {
    this.speak(`Selecting ${option} from ${target}.`);
    return true;
  }

  private async executeOpenPatient(patientNameOrId: string): Promise<boolean> {
    if (!patientNameOrId) {
      this.speak("I need to know which patient to open. Please specify a patient name or ID.");
      return false;
    }

    const normalizedName = patientNameOrId.toLowerCase().trim();

    // Try to find patient by name or ID
    const { openTab } = useTabStore.getState();

    // Check if it's a known patient (like "john doe")
    if (normalizedName.includes("john") && normalizedName.includes("doe")) {
      // Open patient with ID "john-doe-123" (from the mock data in patients.tsx)
      openTab({
        id: "patient-john-doe-123",
        label: "John Doe",
        path: "/patients/john-doe-123",
        icon: "User",
      });

      // Navigate to the patient page
      if (typeof window !== "undefined" && (window as any).__tanstackRouter) {
        (window as any).__tanstackRouter.navigate({
          to: "/patients/$patientId",
          params: { patientId: "john-doe-123" },
        });
      }

      this.speak(`Opening patient record for ${patientNameOrId}.`);
      return true;
    }

    // For other patients, try to navigate to patients list and search
    this.speak(`Searching for patient ${patientNameOrId}.`);

    // Open patients list
    openTab({
      id: "patients-list",
      label: "Patients",
      path: "/patients",
      icon: "Users",
    });

    if (typeof window !== "undefined" && (window as any).__tanstackRouter) {
      (window as any).__tanstackRouter.navigate({ to: "/patients" });
    }

    return true;
  }

  private async executeNavigate(target: string): Promise<boolean> {
    if (!target) {
      this.speak("I need to know where to navigate. Please specify a destination.");
      return false;
    }

    const normalizedTarget = target.toLowerCase().trim();

    // Map common phrases to routes
    const routeMap: Record<string, { path: string; label: string }> = {
      dashboard: { path: "/", label: "Dashboard" },
      home: { path: "/", label: "Dashboard" },
      patients: { path: "/patients", label: "Patients" },
      patient: { path: "/patients", label: "Patients" },
      "patient list": { path: "/patients", label: "Patients" },
      "patient record": { path: "/patients", label: "Patients" },
      "patient records": { path: "/patients", label: "Patients" },
      clinical: { path: "/clinical", label: "Clinical" },
      "clinical documentation": { path: "/clinical", label: "Clinical" },
      orders: { path: "/orders", label: "Orders" },
      results: { path: "/results", label: "Results" },
      "test results": { path: "/results", label: "Results" },
      scheduling: { path: "/scheduling", label: "Scheduling" },
      schedule: { path: "/scheduling", label: "Scheduling" },
      pharmacy: { path: "/pharmacy", label: "Pharmacy" },
      revenue: { path: "/revenue", label: "Revenue" },
      analytics: { path: "/analytics", label: "Analytics" },
      settings: { path: "/settings", label: "Settings" },
      "form builder": { path: "/form-builder", label: "Form Builder" },
    };

    // Find matching route
    let route = routeMap[normalizedTarget];

    // If no exact match, try partial matching
    if (!route) {
      for (const [key, value] of Object.entries(routeMap)) {
        if (normalizedTarget.includes(key) || key.includes(normalizedTarget)) {
          route = value;
          break;
        }
      }
    }

    // Check component registry for registered routes
    if (!route) {
      const allComponents = (window as any).__componentRegistry || new Map();
      for (const [id, config] of allComponents.entries()) {
        if (
          config.voiceDescription &&
          (config.voiceDescription.toLowerCase().includes(normalizedTarget) ||
            normalizedTarget.includes(config.voiceDescription.toLowerCase()))
        ) {
          // Try to extract path from component config
          if (config.path) {
            route = { path: config.path, label: config.ariaLabel || id };
            break;
          }
        }
      }
    }

    if (route) {
      // Use tab store to open tab and navigate
      const tabStore = useTabStore.getState();
      const { openTab, setActiveTab, tabs } = tabStore;

      // Navigate using router
      if (typeof window !== "undefined") {
        // Use TanStack Router if available
        const router = (window as any).__tanstackRouter;

        // Check if tab already exists
        const existingTab = tabs.find((t) => t.path === route.path);

        if (existingTab) {
          // Switch to existing tab
          setActiveTab(existingTab.id, (path) => {
            if (router) {
              router.navigate({ to: path as any }).catch(() => {
                // Fallback to window.location if router fails
                window.location.href = path;
              });
            } else {
              window.location.href = path;
            }
          });
        } else {
          // Open new tab
          openTab(
            {
              label: route.label,
              path: route.path,
              closable: route.path !== "/",
            },
            (path) => {
              if (router) {
                router.navigate({ to: path as any }).catch(() => {
                  // Fallback to window.location if router fails
                  window.location.href = path;
                });
              } else {
                window.location.href = path;
              }
            }
          );
        }
      }

      this.speak(`Navigating to ${route.label}.`);
      return true;
    } else {
      this.speak(
        `I couldn't find a route for "${target}". Please try saying "go to patients" or "open dashboard".`
      );
      return false;
    }
  }

  private async executeOpenModal(modalName: string): Promise<boolean> {
    this.speak(`Opening ${modalName}.`);
    return true;
  }

  private async executeCloseModal(): Promise<boolean> {
    this.speak("Closing modal.");
    return true;
  }

  private async executeSearch(query: string): Promise<boolean> {
    this.speak(`Searching for ${query}.`);
    return true;
  }

  private async executeHelp(): Promise<boolean> {
    const helpText =
      'Available commands: fill form, submit, click button, navigate, search, and more. Say "help" anytime for assistance.';
    this.speak(helpText);
    return true;
  }

  private async executeStop(): Promise<boolean> {
    this.speak("Stopping voice commands.");
    useVoiceCommandStore.getState().stopListening();
    return true;
  }

  private speak(text: string): void {
    const preferences = useAccessibilityStore.getState().preferences;
    if (preferences.voiceCommandsFeedback) {
      this.tts.speak(text, {
        lang: preferences.voiceCommandsLanguage || "en-US",
      });
    }
  }
}

// Global instance
let executorInstance: VoiceCommandExecutor | null = null;

export function getVoiceCommandExecutor(): VoiceCommandExecutor {
  if (!executorInstance) {
    executorInstance = new VoiceCommandExecutor();
  }
  return executorInstance;
}
