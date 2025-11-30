/**
 * Font Size Selector
 * Adjust font size for better readability
 */

import { Box } from "@/components/ui/box";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { useEffect } from "react";

export function FontSizeSelector() {
  const fontSize = useAccessibilityStore((state) => state.preferences.fontSize);
  const updatePreference = useAccessibilityStore((state) => state.updatePreference);

  useEffect(() => {
    if (typeof document !== "undefined") {
      // Remove all font size classes
      document.documentElement.classList.remove(
        "font-size-small",
        "font-size-medium",
        "font-size-large",
        "font-size-extra-large"
      );
      // Add current font size class
      document.documentElement.classList.add(`font-size-${fontSize}`);
    }
  }, [fontSize]);

  return (
    <Box>
      <label htmlFor="font-size" className="text-sm block mb-2">
        Font Size
      </label>
      <select
        id="font-size"
        value={fontSize}
        onChange={(e) =>
          updatePreference(
            "fontSize",
            e.target.value as "small" | "medium" | "large" | "extra-large"
          )
        }
        className="w-full px-3 py-2 border rounded-md"
        aria-label="Select font size"
      >
        <option value="small">Small</option>
        <option value="medium">Medium</option>
        <option value="large">Large</option>
        <option value="extra-large">Extra Large</option>
      </select>
    </Box>
  );
}
