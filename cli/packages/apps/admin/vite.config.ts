import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: Number(process.env.VITE_PORT) || 5174,
    host: process.env.VITE_HOST || "localhost",
    strictPort: process.env.VITE_STRICT_PORT !== "false",
    open: process.env.VITE_OPEN === "true",
  },
  build: {
    outDir: process.env.VITE_BUILD_OUT_DIR || "dist",
    sourcemap: process.env.VITE_SOURCEMAP === "true",
    minify: process.env.VITE_MINIFY !== "false" ? "esbuild" : false,
  },
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
});
