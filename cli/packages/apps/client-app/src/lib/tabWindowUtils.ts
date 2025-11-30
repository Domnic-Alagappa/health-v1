/**
 * Utility functions for creating standalone windows from dragged tabs
 */

import { openNewWindow } from "./tauriUtils";

interface CreateStandaloneWindowOptions {
  draggedTab: {
    id: string;
    label: string;
    path: string;
    closable?: boolean;
    allowDuplicate?: boolean;
  };
  e: MouseEvent;
  onClose: (tabId: string) => void;
}

export async function createStandaloneWindow({
  draggedTab,
  e,
  onClose,
}: CreateStandaloneWindowOptions): Promise<void> {
  if (!draggedTab.path) return;

  // Generate a secure, one-time token for passing tab data
  // This avoids exposing sensitive data (like patient names in tab labels) in URLs
  const token = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

  // Store tab info in sessionStorage with token as key (single-use, same-origin only)
  // sessionStorage is isolated per origin and cleared when tab closes
  const tabData = {
    label: draggedTab.label,
    path: draggedTab.path,
    closable: draggedTab.closable ?? true,
    allowDuplicate: draggedTab.allowDuplicate ?? false,
    timestamp: Date.now(), // For expiration check
  };

  try {
    sessionStorage.setItem(`_tab_${token}`, JSON.stringify(tabData));

    // Set expiration (5 minutes) - auto-cleanup old tokens
    sessionStorage.setItem(`_tab_${token}_expires`, String(Date.now() + 5 * 60 * 1000));

    // Create new window with only the token in URL (no sensitive data)
    const url = new URL(draggedTab.path, window.location.origin);
    url.searchParams.set("_tab", token);

    // Use Tauri-aware window opening utility
    const newWindow = await openNewWindow(url.toString(), draggedTab.label, {
      width: 1200,
      height: 800,
      x: e.screenX - 100,
      y: e.screenY - 50,
    });

    // If window was successfully created
    if (newWindow) {
      // Clean up token after window loads (with delay to ensure new window reads it)
      setTimeout(() => {
        try {
          sessionStorage.removeItem(`_tab_${token}`);
          sessionStorage.removeItem(`_tab_${token}_expires`);
        } catch (_err) {
          // Ignore cleanup errors
        }
      }, 2000);

      // Close the tab from the original window
      onClose(draggedTab.id);
    } else {
      // Window opening blocked - cleanup immediately
      sessionStorage.removeItem(`_tab_${token}`);
      sessionStorage.removeItem(`_tab_${token}_expires`);
    }
  } catch (err) {
    console.error("Error creating standalone window:", err);
    // Cleanup on error
    try {
      sessionStorage.removeItem(`_tab_${token}`);
      sessionStorage.removeItem(`_tab_${token}_expires`);
    } catch (_cleanupErr) {
      // Ignore cleanup errors
    }
  }
}
