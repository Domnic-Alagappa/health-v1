import { defineConfig } from "tsup";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/api/index.ts",
    "src/api/routes.ts",
    "src/api/config.ts",
    "src/api/types.ts",
    "src/constants/index.ts",
    "src/constants/permissions.ts",
    "src/constants/security.ts",
    "src/constants/fields.ts",
    "src/constants/oidc.ts",
    "src/types/index.ts",
    "src/types/user.ts",
    "src/types/patient.ts",
    "src/types/audit.ts",
    "src/types/common.ts",
    "src/types/stores/index.ts",
    "src/types/stores/voice.ts",
    "src/types/stores/ui.ts",
    "src/types/stores/tab.ts",
    "src/types/stores/accessibility.ts",
    "src/types/stores/audit.ts",
    "src/types/stores/auth.ts",
    "src/types/components/registry.ts",
    "src/i18n/index.ts",
    "src/i18n/types.ts",
    "src/i18n/locales.ts",
  ],
  format: ["esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  outExtension() {
    return {
      js: `.js`,
    };
  },
});

