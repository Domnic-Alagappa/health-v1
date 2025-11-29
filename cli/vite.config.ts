import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

const __dirname = fileURLToPath(new URL(".", import.meta.url))

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
    outDir: resolve(__dirname, "dist"),
  },
  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },
  clearScreen: false,
})
