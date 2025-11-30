import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: __dirname,
  publicDir: resolve(__dirname, "public"),
  plugins: [tanstackRouter(), react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: process.env.VITE_BUILD_OUT_DIR || resolve(__dirname, "dist"),
    sourcemap: process.env.VITE_SOURCEMAP === "true",
    minify: process.env.VITE_MINIFY !== "false" ? "esbuild" : false,
  },
  server: {
    port: Number(process.env.VITE_PORT) || 5173,
    host: process.env.VITE_HOST || "localhost",
    strictPort: process.env.VITE_STRICT_PORT !== "false",
    open: process.env.VITE_OPEN !== "false",
  },
  clearScreen: false,
  envPrefix: ["VITE_", "TAURI_"],
});
