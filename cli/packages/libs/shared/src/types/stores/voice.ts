/**
 * Voice command store types
 */

export interface VoiceCommandState {
  isListening: boolean;
  isProcessing: boolean;
  lastCommand: string | null;
  lastIntent: string | null;
  error: string | null;
  commandHistory: Array<{
    command: string;
    intent: string;
    timestamp: number;
    success: boolean;
  }>;
  currentWorkflow: {
    type: string;
    step: number;
    data: Record<string, unknown>;
  } | null;
}

export interface VoiceCommandActions {
  startListening: () => void;
  stopListening: () => void;
  setProcessing: (processing: boolean) => void;
  setLastCommand: (command: string | null) => void;
  setLastIntent: (intent: string | null) => void;
  setError: (error: string | null) => void;
  addToHistory: (command: string, intent: string, success: boolean) => void;
  setCurrentWorkflow: (workflow: VoiceCommandState["currentWorkflow"]) => void;
  clearHistory: () => void;
}

export type VoiceCommandStore = VoiceCommandState & VoiceCommandActions;
