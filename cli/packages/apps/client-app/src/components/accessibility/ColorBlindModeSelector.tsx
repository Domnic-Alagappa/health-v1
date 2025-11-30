/**
 * Color Blind Mode Selector
 * Select color blind mode filter
 */

import { Box } from "@/components/ui/box";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { useEffect } from "react";

export function ColorBlindModeSelector() {
  const colorBlindMode = useAccessibilityStore((state) => state.preferences.colorBlindMode);
  const updatePreference = useAccessibilityStore((state) => state.updatePreference);

  useEffect(() => {
    if (typeof document !== "undefined") {
      // Remove all color blind data attributes
      document.documentElement.removeAttribute("data-cb");
      // Set current color blind mode data attribute if not 'none'
      if (colorBlindMode !== "none") {
        // Map full names to short names for CSS selectors
        const modeMap: Record<string, string> = {
          protanopia: "protan",
          deuteranopia: "deutan",
          tritanopia: "tritan",
        };
        const shortName = modeMap[colorBlindMode] || colorBlindMode;
        document.documentElement.setAttribute("data-cb", shortName);
      }
    }
  }, [colorBlindMode]);

  return (
    <Box>
      <label htmlFor="color-blind-mode" className="text-sm block mb-2">
        Color Blind Mode
      </label>
      <select
        id="color-blind-mode"
        value={colorBlindMode}
        onChange={(e) =>
          updatePreference(
            "colorBlindMode",
            e.target.value as "none" | "protanopia" | "deuteranopia" | "tritanopia"
          )
        }
        className="w-full px-3 py-2 border rounded-md"
        aria-label="Select color blind mode"
      >
        <option value="none">None</option>
        <option value="protanopia">Protanopia (Red-Blind)</option>
        <option value="deuteranopia">Deuteranopia (Green-Blind)</option>
        <option value="tritanopia">Tritanopia (Blue-Blind)</option>
      </select>
    </Box>
  );
}
