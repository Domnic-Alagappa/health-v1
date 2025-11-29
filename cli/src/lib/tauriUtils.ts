/**
 * Tauri utility functions
 * Handles window management for both browser and Tauri environments
 */

// Check if running in Tauri
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window
}

/**
 * Opens a new window - works in both browser and Tauri
 */
export async function openNewWindow(
  url: string,
  label: string,
  options?: {
    width?: number
    height?: number
    x?: number
    y?: number
  }
): Promise<Window | null> {
  if (isTauri()) {
    try {
      // Dynamic import to avoid errors when not in Tauri
      const { WebviewWindow } = await import("@tauri-apps/api/window")

      // Generate a unique label for the window
      const windowLabel = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

      // Create new Tauri window
      const webview = new WebviewWindow(windowLabel, {
        url: url,
        title: `${label} - EHR Platform`,
        width: options?.width || 1200,
        height: options?.height || 800,
        x: options?.x,
        y: options?.y,
        center: !options?.x || !options?.y, // Center if position not specified
        resizable: true,
        minimizable: true,
        maximizable: true,
        closable: true,
        visible: true,
      })

      // Wait for window to be created and focused
      await webview.once("tauri://created")
      await webview.setFocus()

      // Return a mock window-like object for compatibility
      return {
        closed: false,
        document: {
          title: `${label} - EHR Platform`,
        },
        focus: () => webview.setFocus(),
        close: () => webview.close(),
      } as any
    } catch (error) {
      console.error("Error creating Tauri window:", error)
      return null
    }
  } else {
    // Browser environment - use window.open
    const windowFeatures = [
      `width=${options?.width || 1200}`,
      `height=${options?.height || 800}`,
      options?.x ? `left=${options.x}` : "",
      options?.y ? `top=${options.y}` : "",
      "resizable=yes",
      "scrollbars=yes",
    ]
      .filter(Boolean)
      .join(",")

    return window.open(url, `tab-${Date.now()}`, windowFeatures)
  }
}
