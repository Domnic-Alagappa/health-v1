/**
 * Axe Accessibility Testing
 * Integrates @axe-core/react for accessibility testing in development
 */

import React from "react"
import ReactDOM from "react-dom/client"

let axeInitialized = false

export function initializeAxe() {
  if (import.meta.env.DEV && typeof window !== "undefined" && !axeInitialized) {
    // Dynamically import axe-core/react only in development
    import("@axe-core/react")
      .then((axe) => {
        if (axe.default) {
          axe.default(React, ReactDOM, 1000)
          axeInitialized = true
          console.log("Axe accessibility testing initialized")
        }
      })
      .catch((err) => {
        console.warn("Failed to load axe-core:", err)
      })
  }
}
