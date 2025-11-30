/**
 * High Contrast Toggle
 * Toggle high contrast mode
 */

import { Box } from "@/components/ui/box";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { useEffect } from "react";

export function HighContrastToggle() {
  const highContrast = useAccessibilityStore((state) => state.preferences.highContrast);
  const updatePreference = useAccessibilityStore((state) => state.updatePreference);

  useEffect(() => {
    if (typeof document !== "undefined") {
      if (highContrast) {
        document.documentElement.classList.add("high-contrast");
      } else {
        document.documentElement.classList.remove("high-contrast");
      }
    }
  }, [highContrast]);

  return (
    <Box className="flex items-center justify-between">
      <label htmlFor="high-contrast" className="text-sm cursor-pointer">
        High Contrast Mode
      </label>
      <input
        id="high-contrast"
        type="checkbox"
        checked={highContrast}
        onChange={(e) => updatePreference("highContrast", e.target.checked)}
        className="h-4 w-4"
        aria-label="Toggle high contrast mode"
      />
    </Box>
  );
}
