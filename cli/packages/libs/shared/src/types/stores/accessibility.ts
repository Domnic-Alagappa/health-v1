/**
 * Accessibility store types
 */

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
  voiceName: string | null // Selected voice name from available voices
  voicePitch: number // 0.0 to 2.0, default 1.0
  voiceRate: number // 0.1 to 10.0, default 1.0
  voiceVolume: number // 0.0 to 1.0, default 1.0

  // Screen Reader
  screenReaderOptimized: boolean
  announcePageChanges: boolean
  announceFormErrors: boolean

  // Other
  autoSave: boolean
  showAccessibilityShortcuts: boolean // Show keyboard shortcut hints
}

export interface AccessibilityState {
  preferences: AccessibilityPreferences
  isVoiceCommandActive: boolean
  lastVoiceCommand: string | null
  voiceCommandError: string | null
}

export interface AccessibilityActions {
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

export type AccessibilityStore = AccessibilityState & AccessibilityActions

