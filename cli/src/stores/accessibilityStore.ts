/**
 * Accessibility Store
 * Manages accessibility preferences and settings
 * WCAG 2.1 AA/AAA compliant
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface AccessibilityPreferences {
  // Visual Accessibility
  highContrast: boolean
  fontSize: "small" | "medium" | "large" | "extra-large"
  fontFamily: "default" | "dyslexic" | "monospace"
  colorBlindMode: "none" | "protanopia" | "deuteranopia" | "tritanopia"
  reduceMotion: boolean
  showFocusIndicators: boolean
  focusIndicatorSize: "small" | "medium" | "large"

  // Hearing Accessibility
  showCaptions: boolean
  captionSize: "small" | "medium" | "large"
  captionPosition: "bottom" | "top" | "left" | "right"
  visualAlerts: boolean // Visual indicators for audio alerts

  // Motor Accessibility
  keyboardNavigation: boolean
  stickyKeys: boolean // Allow sequential key presses instead of simultaneous
  slowKeys: boolean // Delay before key is accepted
  repeatKeys: boolean // Disable key repeat

  // Cognitive Accessibility
  simplifiedUI: boolean
  showTooltips: boolean
  confirmActions: boolean // Require confirmation for destructive actions

  // Voice Commands
  voiceCommandsEnabled: boolean
  voiceCommandsLanguage: string // e.g., 'en-US', 'en-GB'
  voiceCommandsFeedback: boolean // Audio/visual feedback when command recognized

  // Screen Reader
  screenReaderOptimized: boolean
  announcePageChanges: boolean
  announceFormErrors: boolean

  // Other
  autoSave: boolean
  showAccessibilityShortcuts: boolean // Show keyboard shortcut hints
}

interface AccessibilityState {
  preferences: AccessibilityPreferences
  isVoiceCommandActive: boolean
  lastVoiceCommand: string | null
  voiceCommandError: string | null
}

interface AccessibilityActions {
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void
  resetPreferences: () => void
  setVoiceCommandActive: (active: boolean) => void
  setLastVoiceCommand: (command: string | null) => void
  setVoiceCommandError: (error: string | null) => void
  togglePreference: <K extends keyof AccessibilityPreferences>(key: K) => void
}

type AccessibilityStore = AccessibilityState & AccessibilityActions

const defaultPreferences: AccessibilityPreferences = {
  // Visual
  highContrast: false,
  fontSize: "medium",
  fontFamily: "default",
  colorBlindMode: "none",
  reduceMotion: false,
  showFocusIndicators: true,
  focusIndicatorSize: "medium",

  // Hearing
  showCaptions: false,
  captionSize: "medium",
  captionPosition: "bottom",
  visualAlerts: false,

  // Motor
  keyboardNavigation: true,
  stickyKeys: false,
  slowKeys: false,
  repeatKeys: true,

  // Cognitive
  simplifiedUI: false,
  showTooltips: true,
  confirmActions: false,

  // Voice
  voiceCommandsEnabled: false,
  voiceCommandsLanguage: "en-US",
  voiceCommandsFeedback: true,

  // Screen Reader
  screenReaderOptimized: false,
  announcePageChanges: true,
  announceFormErrors: true,

  // Other
  autoSave: false,
  showAccessibilityShortcuts: false,
}

const initialState: AccessibilityState = {
  preferences: defaultPreferences,
  isVoiceCommandActive: false,
  lastVoiceCommand: null,
  voiceCommandError: null,
}

export const useAccessibilityStore = create<AccessibilityStore>()(
  persist(
    (set) => ({
      ...initialState,

      updatePreference: (key, value) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [key]: value,
          },
        }))
      },

      togglePreference: (key) => {
        set((state) => {
          const currentValue = state.preferences[key]
          if (typeof currentValue === "boolean") {
            return {
              preferences: {
                ...state.preferences,
                [key]: !currentValue,
              },
            }
          }
          return state
        })
      },

      resetPreferences: () => {
        set({
          preferences: defaultPreferences,
        })
      },

      setVoiceCommandActive: (active) => {
        set({ isVoiceCommandActive: active })
      },

      setLastVoiceCommand: (command) => {
        set({ lastVoiceCommand: command })
      },

      setVoiceCommandError: (error) => {
        set({ voiceCommandError: error })
      },
    }),
    {
      name: "accessibility-storage",
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
)

// Atomic selectors
export const useAccessibilityPreferences = () => useAccessibilityStore((state) => state.preferences)
export const useUpdateAccessibilityPreference = () =>
  useAccessibilityStore((state) => state.updatePreference)
export const useToggleAccessibilityPreference = () =>
  useAccessibilityStore((state) => state.togglePreference)
export const useResetAccessibilityPreferences = () =>
  useAccessibilityStore((state) => state.resetPreferences)
export const useIsVoiceCommandActive = () =>
  useAccessibilityStore((state) => state.isVoiceCommandActive)
export const useLastVoiceCommand = () => useAccessibilityStore((state) => state.lastVoiceCommand)
export const useVoiceCommandError = () => useAccessibilityStore((state) => state.voiceCommandError)
