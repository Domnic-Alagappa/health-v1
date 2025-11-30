/**
 * Accessibility Store
 * Manages accessibility preferences and settings
 * WCAG 2.1 AA/AAA compliant
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  AccessibilityActions,
  AccessibilityPreferences,
  AccessibilityState,
  AccessibilityStore,
} from "@health-v1/shared/types/stores/accessibility";

// Re-export types
export type {
  AccessibilityPreferences,
  AccessibilityState,
  AccessibilityActions,
  AccessibilityStore,
};

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
  voiceName: null, // Will be set to default system voice
  voicePitch: 1.0,
  voiceRate: 1.0,
  voiceVolume: 1.0,

  // Screen Reader
  screenReaderOptimized: false,
  announcePageChanges: true,
  announceFormErrors: true,

  // Other
  autoSave: false,
  showAccessibilityShortcuts: false,
};

const initialState: AccessibilityState = {
  preferences: defaultPreferences,
  isVoiceCommandActive: false,
  lastVoiceCommand: null,
  voiceCommandError: null,
};

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
        }));
      },

      togglePreference: (key) => {
        set((state) => {
          const currentValue = state.preferences[key];
          if (typeof currentValue === "boolean") {
            return {
              preferences: {
                ...state.preferences,
                [key]: !currentValue,
              },
            };
          }
          return state;
        });
      },

      resetPreferences: () => {
        set({
          preferences: defaultPreferences,
        });
      },

      setVoiceCommandActive: (active) => {
        set({ isVoiceCommandActive: active });
      },

      setLastVoiceCommand: (command) => {
        set({ lastVoiceCommand: command });
      },

      setVoiceCommandError: (error) => {
        set({ voiceCommandError: error });
      },
    }),
    {
      name: "accessibility-storage",
      partialize: (state) => ({
        preferences: state.preferences,
      }),
    }
  )
);

// Atomic selectors
export const useAccessibilityPreferences = () =>
  useAccessibilityStore((state) => state.preferences);
export const useUpdateAccessibilityPreference = () =>
  useAccessibilityStore((state) => state.updatePreference);
export const useToggleAccessibilityPreference = () =>
  useAccessibilityStore((state) => state.togglePreference);
export const useResetAccessibilityPreferences = () =>
  useAccessibilityStore((state) => state.resetPreferences);
export const useIsVoiceCommandActive = () =>
  useAccessibilityStore((state) => state.isVoiceCommandActive);
export const useLastVoiceCommand = () => useAccessibilityStore((state) => state.lastVoiceCommand);
export const useAccessibilityVoiceCommandError = () =>
  useAccessibilityStore((state) => state.voiceCommandError);
