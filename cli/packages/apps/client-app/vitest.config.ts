import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "import.meta.env": JSON.stringify({
      VITE_OIDC_ISSUER: "http://localhost:8080",
      VITE_OIDC_CLIENT_ID: "test-client",
      VITE_OIDC_REDIRECT_URI: "http://localhost:5173",
    }),
  },
});
