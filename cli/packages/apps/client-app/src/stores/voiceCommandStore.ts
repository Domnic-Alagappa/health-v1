/**
 * Voice Command Store
 * Manages voice command state and recognition
 */

import { create } from "zustand"

export interface VoiceCommandState {
  isListening: boolean
  isProcessing: boolean
  lastCommand: string | null
  lastIntent: string | null
  error: string | null
  commandHistory: Array<{
    command: string
    intent: string
    timestamp: number
    success: boolean
  }>
  currentWorkflow: {
    type: string
    step: number
    data: Record<string, unknown>
  } | null
}

interface VoiceCommandActions {
  startListening: () => void
  stopListening: () => void
  setProcessing: (processing: boolean) => void
  setLastCommand: (command: string | null) => void
  setLastIntent: (intent: string | null) => void
  setError: (error: string | null) => void
  addToHistory: (command: string, intent: string, success: boolean) => void
  setCurrentWorkflow: (workflow: VoiceCommandState["currentWorkflow"]) => void
  clearHistory: () => void
}

type VoiceCommandStore = VoiceCommandState & VoiceCommandActions

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
