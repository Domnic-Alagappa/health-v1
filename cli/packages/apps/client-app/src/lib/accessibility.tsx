/**
 * Accessibility utilities for braille and screen reader support
 * WCAG 2.1 AA/AAA compliant
 */

import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { useVoiceCommandStore } from "@/stores/voiceCommandStore";
import type * as React from "react";
import { COMMON_SHORTCUTS, keyboardShortcutManager } from "./keyboard/shortcuts";
import { getVoiceCommandEngine } from "./voice/voiceCommandEngine";

/**
 * Skip to main content link - allows keyboard users to skip navigation
 */
export function SkipToMainContent(): React.ReactElement {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-sm focus:shadow-fluent-3 focus:outline-none focus:ring-2 focus:ring-ring"
      aria-label="Skip to main content"
    >
      Skip to main content
    </a>
  );
}

/**
 * Live region for screen reader announcements
 */
export function createLiveRegion(level: "polite" | "assertive" = "polite") {
  const region = document.createElement("div");
  region.setAttribute("role", "status");
  region.setAttribute("aria-live", level);
  region.setAttribute("aria-atomic", "true");
  region.className = "sr-only";
  document.body.appendChild(region);
  return region;
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(message: string, level: "polite" | "assertive" = "polite") {
  const region = createLiveRegion(level);
  region.textContent = message;
  setTimeout(() => {
    region.textContent = "";
  }, 1000);
}

/**
 * Get accessible label for form fields
 */
export function getAccessibleLabel(
  label: string,
  required?: boolean,
  description?: string
): string {
  let accessibleLabel = label;
  if (required) {
    accessibleLabel += " (required)";
  }
  if (description) {
    accessibleLabel += `. ${description}`;
  }
  return accessibleLabel;
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardKeys = {
  Enter: "Enter",
  Space: " ",
  Escape: "Escape",
  Tab: "Tab",
  ArrowUp: "ArrowUp",
  ArrowDown: "ArrowDown",
  ArrowLeft: "ArrowLeft",
  ArrowRight: "ArrowRight",
  Home: "Home",
  End: "End",
} as const;

/**
 * Check if element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
    "[contenteditable='true']",
  ].join(", ");

  return element.matches(focusableSelectors);
}

/**
 * Trap focus within a container (for modals, dialogs)
 */
export function trapFocus(container: HTMLElement) {
  const focusableElements = container.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  function handleTabKey(e: KeyboardEvent) {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  }

  container.addEventListener("keydown", handleTabKey);
  firstElement?.focus();

  return () => {
    container.removeEventListener("keydown", handleTabKey);
  };
}

/**
 * Get accessible error message
 */
export function getErrorMessage(fieldName: string, error: string): string {
  return `${fieldName} error: ${error}`;
}

/**
 * High contrast mode detection
 */
export function prefersHighContrast(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-contrast: high)").matches;
}

/**
 * Reduced motion detection
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Screen reader detection (basic)
 */
export function isScreenReaderActive(): boolean {
  // This is a basic check - screen readers may not always be detectable
  return (
    navigator.userAgent.includes("NVDA") ||
    navigator.userAgent.includes("JAWS") ||
    navigator.userAgent.includes("VoiceOver") ||
    document.querySelector('[role="application"][aria-label*="screen reader"]') !== null
  );
}

/**
 * Initialize accessibility features
 * Sets up keyboard shortcuts and other accessibility features
 */
export function initializeAccessibility(): void {
  // Register common keyboard shortcuts
  keyboardShortcutManager.register({
    ...COMMON_SHORTCUTS.OPEN_ACCESSIBILITY,
    action: () => {
      // Trigger accessibility panel open
      const event = new CustomEvent("open-accessibility-panel");
      window.dispatchEvent(event);
    },
    global: true,
  });

  keyboardShortcutManager.register({
    ...COMMON_SHORTCUTS.TOGGLE_VOICE_COMMANDS,
    action: () => {
      const preferences = useAccessibilityStore.getState().preferences;
      if (preferences.voiceCommandsEnabled) {
        const engine = getVoiceCommandEngine();
        const voiceStore = useVoiceCommandStore.getState();
        if (voiceStore.isListening) {
          engine.stop();
        } else {
          engine.start({ language: preferences.voiceCommandsLanguage || "en-US" });
        }
      }
    },
    global: true,
  });

  // Register escape key for closing modals
  keyboardShortcutManager.register({
    ...COMMON_SHORTCUTS.ESCAPE,
    action: () => {
      // Close any open modals/dialogs
      const event = new KeyboardEvent("keydown", { key: "Escape", bubbles: true });
      document.activeElement?.dispatchEvent(event);
    },
    global: true,
  });
}
