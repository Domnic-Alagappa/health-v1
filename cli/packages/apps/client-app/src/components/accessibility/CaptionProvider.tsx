/**
 * Caption Provider
 * Caption overlay for audio/video content
 */

import { Box } from "@/components/ui/box";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { useEffect, useState } from "react";

export interface CaptionProviderProps {
  children: React.ReactNode;
  captions?: string[];
  autoGenerate?: boolean;
}

export function CaptionProvider({
  children,
  captions,
  autoGenerate = false,
}: CaptionProviderProps) {
  const showCaptions = useAccessibilityStore((state) => state.preferences.showCaptions);
  const captionSize = useAccessibilityStore((state) => state.preferences.captionSize);
  const captionPosition = useAccessibilityStore((state) => state.preferences.captionPosition);
  const [currentCaption, setCurrentCaption] = useState<string>("");

  // In a real implementation, this would listen to audio/video events
  // and update captions in real-time
  useEffect(() => {
    if (autoGenerate && captions) {
      // Simulate caption updates
      let index = 0;
      const interval = setInterval(() => {
        if (index < captions.length) {
          setCurrentCaption(captions[index] ?? "");
          index++;
        } else {
          clearInterval(interval);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoGenerate, captions]);

  if (!showCaptions) {
    return <>{children}</>;
  }

  const sizeClasses = {
    small: "text-xs",
    medium: "text-sm",
    large: "text-base",
  };

  const positionClasses = {
    bottom: "bottom-4 left-1/2 -translate-x-1/2",
    top: "top-4 left-1/2 -translate-x-1/2",
    left: "left-4 top-1/2 -translate-y-1/2",
    right: "right-4 top-1/2 -translate-y-1/2",
  };

  return (
    <Box className="relative">
      {children}
      {currentCaption && (
        <Box
          className={`absolute ${positionClasses[captionPosition]} ${sizeClasses[captionSize]} bg-black/75 text-white px-4 py-2 rounded-md z-50`}
          role="caption"
          aria-live="polite"
        >
          {currentCaption}
        </Box>
      )}
    </Box>
  );
}
