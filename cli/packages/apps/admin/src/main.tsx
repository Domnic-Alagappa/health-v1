import React from "react"
import ReactDOM from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import Router from "./router"
import "./index.css"

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
})

// Validate environment on startup
async function init() {
  try {
    await import("./lib/env")
  } catch (error) {
    console.error("Environment validation failed:", error)
    // Show error in development
    if (import.meta.env.DEV) {
      const root = document.getElementById("root")
      if (root) {
        root.innerHTML = `
          <div style="padding: 2rem; font-family: system-ui; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #dc2626; margin-bottom: 1rem;">Configuration Error</h1>
            <p style="color: #6b7280; margin-bottom: 1rem;">${error instanceof Error ? error.message : "Unknown error"}</p>
            <p style="color: #6b7280; font-size: 0.875rem;">
              Please check your .env file and ensure all required variables are set.
            </p>
          </div>
        `
      }
      return
    }
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
      <Router />
      </QueryClientProvider>
    </React.StrictMode>,
  )
}

init()

