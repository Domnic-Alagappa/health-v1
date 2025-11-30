/**
 * Voice Command Store
 * Manages voice command state and recognition
 */

import { create } from "zustand"

import type {
  VoiceCommandState,
  VoiceCommandActions,
  VoiceCommandStore,
} from "@health-v1/shared/types/stores/voice"

// Re-export types
export type {
  VoiceCommandState,
  VoiceCommandActions,
  VoiceCommandStore,
}

const initialState: VoiceCommandState = {
  isListening: false,
  isProcessing: false,
  lastCommand: null,
  lastIntent: null,
  error: null,
  commandHistory: [],
  currentWorkflow: null,
}

export const useVoiceCommandStore = create<VoiceCommandStore>()((set) => ({
  ...initialState,

  startListening: () => {
    set({ isListening: true, error: null })
  },

  stopListening: () => {
    set({ isListening: false })
  },

  setProcessing: (processing: boolean) => {
    set({ isProcessing: processing })
  },

  setLastCommand: (command: string | null) => {
    set({ lastCommand: command })
  },

  setLastIntent: (intent: string | null) => {
    set({ lastIntent: intent })
  },

  setError: (error: string | null) => {
    set({ error })
  },

  addToHistory: (command: string, intent: string, success: boolean) => {
    set((state) => ({
      commandHistory: [
        {
          command,
          intent,
          timestamp: Date.now(),
          success,
        },
        ...state.commandHistory.slice(0, 49), // Keep last 50 commands
      ],
    }))
  },

  setCurrentWorkflow: (workflow: VoiceCommandState["currentWorkflow"]) => {
    set({ currentWorkflow: workflow })
  },

  clearHistory: () => {
    set({ commandHistory: [] })
  },
}))

// Atomic selectors
export const useIsListening = () => useVoiceCommandStore((state) => state.isListening)
export const useIsProcessing = () => useVoiceCommandStore((state) => state.isProcessing)
export const useLastCommand = () => useVoiceCommandStore((state) => state.lastCommand)
export const useLastIntent = () => useVoiceCommandStore((state) => state.lastIntent)
export const useVoiceCommandError = () => useVoiceCommandStore((state) => state.error)
export const useCommandHistory = () => useVoiceCommandStore((state) => state.commandHistory)
export const useCurrentWorkflow = () => useVoiceCommandStore((state) => state.currentWorkflow)
export const useStartListening = () => useVoiceCommandStore((state) => state.startListening)
export const useStopListening = () => useVoiceCommandStore((state) => state.stopListening)
