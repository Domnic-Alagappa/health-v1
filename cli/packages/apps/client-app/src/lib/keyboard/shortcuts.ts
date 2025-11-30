/**
 * Keyboard Shortcuts System
 * Centralized keyboard shortcut management
 */

export interface KeyboardShortcut {
  id: string
  keys: string[] // e.g., ['Ctrl', 'K'] or ['Alt', 'Shift', 'S']
  description: string
  action: () => void
  category?: string
  global?: boolean // Whether shortcut works globally or only in specific contexts
}

class KeyboardShortcutManager {
  private shortcuts: Map<string, KeyboardShortcut> = new Map()
  private activeShortcuts: Set<string> = new Set()
  private keyState: Set<string> = new Set()

  public register(shortcut: KeyboardShortcut): void {
    this.shortcuts.set(shortcut.id, shortcut)
    if (shortcut.global) {
      this.activeShortcuts.add(shortcut.id)
    }
  }

  public unregister(id: string): void {
    this.shortcuts.delete(id)
    this.activeShortcuts.delete(id)
  }

  public activate(id: string): void {
    this.activeShortcuts.add(id)
  }

  public deactivate(id: string): void {
    this.activeShortcuts.delete(id)
  }

  public handleKeyDown(event: KeyboardEvent): void {
    this.keyState.add(event.key)

    // Check for matching shortcuts
    for (const id of this.activeShortcuts) {
      const shortcut = this.shortcuts.get(id)
      if (!shortcut) continue

      if (this.matchesShortcut(shortcut, event)) {
        event.preventDefault()
        event.stopPropagation()
        shortcut.action()
        break
      }
    }
  }

  public handleKeyUp(event: KeyboardEvent): void {
    this.keyState.delete(event.key)
  }

  private matchesShortcut(shortcut: KeyboardShortcut, event: KeyboardEvent): boolean {
    const requiredKeys = shortcut.keys.map((k) => k.toLowerCase())
    const pressedKeys = new Set<string>()

    // Check modifier keys
    if (event.ctrlKey || event.metaKey) {
      pressedKeys.add("ctrl")
    }
    if (event.altKey) {
      pressedKeys.add("alt")
    }
    if (event.shiftKey) {
      pressedKeys.add("shift")
    }

    // Add the main key
    pressedKeys.add(event.key.toLowerCase())

    // Check if all required keys are pressed
    for (const key of requiredKeys) {
      if (!pressedKeys.has(key)) {
        return false
      }
    }

    return pressedKeys.size === requiredKeys.length
  }

  public getAllShortcuts(): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values())
  }

  public getShortcutsByCategory(category: string): KeyboardShortcut[] {
    return Array.from(this.shortcuts.values()).filter((s) => s.category === category)
  }
}

// Global instance
export const keyboardShortcutManager = new KeyboardShortcutManager()

// Initialize global keyboard listeners
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => {
    keyboardShortcutManager.handleKeyDown(e)
  })

  window.addEventListener("keyup", (e) => {
    keyboardShortcutManager.handleKeyUp(e)
  })
}

// Common shortcuts
export const COMMON_SHORTCUTS = {
  // Navigation
  OPEN_ACCESSIBILITY: {
    id: "open-accessibility",
    keys: ["Alt", "A"],
    description: "Open accessibility settings",
  },
  TOGGLE_VOICE_COMMANDS: {
    id: "toggle-voice",
    keys: ["Ctrl", "Shift", "V"],
    description: "Toggle voice commands",
  },
  SEARCH: { id: "search", keys: ["Ctrl", "K"], description: "Open search" },

  // General
  ESCAPE: { id: "escape", keys: ["Escape"], description: "Close dialog/modal" },
  ENTER: { id: "enter", keys: ["Enter"], description: "Submit/Confirm" },

  // Navigation
  GO_BACK: { id: "go-back", keys: ["Alt", "ArrowLeft"], description: "Go back" },
  GO_FORWARD: { id: "go-forward", keys: ["Alt", "ArrowRight"], description: "Go forward" },
}
