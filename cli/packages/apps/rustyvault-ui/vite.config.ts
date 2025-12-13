import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: Number(process.env.VITE_PORT) || 3000,
    host: process.env.VITE_HOST || "localhost",
    proxy: {
      "/v1": {
        target: process.env.VITE_API_BASE_URL || "http://127.0.0.1:8201",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "query-vendor": ["@tanstack/react-query"],
          "ui-vendor": ["@health-v1/ui-components"],
        },
      },
    },
  },
  envPrefix: ["VITE_"],
});

