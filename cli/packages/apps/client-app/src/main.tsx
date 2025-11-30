import { QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import ReactDOM from "react-dom/client";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { initializeAxe } from "./lib/accessibility/axe";
import { validateEnv } from "./lib/env";
import { TranslationProvider } from "./lib/i18n/TranslationProvider";
import { queryClient } from "./lib/queryClient";
import Router from "./router.tsx";
import "./index.css";

// Validate environment variables
validateEnv();

// Initialize axe accessibility testing in development
initializeAxe();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TranslationProvider defaultLocale="en">
          <Router />
        </TranslationProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
