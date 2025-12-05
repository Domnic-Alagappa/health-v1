import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/components/button.tsx",
    "src/components/input.tsx",
    "src/components/label.tsx",
    "src/components/box.tsx",
    "src/components/flex.tsx",
    "src/components/stack.tsx",
    "src/components/card.tsx",
    "src/components/avatar.tsx",
    "src/components/dropdown-menu.tsx",
    "src/components/badge.tsx",
    "src/components/container.tsx",
  ],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  external: ["react", "react-dom", "@health-v1/shared"],
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  outExtension() {
    return {
      js: `.js`,
    };
  },
});

