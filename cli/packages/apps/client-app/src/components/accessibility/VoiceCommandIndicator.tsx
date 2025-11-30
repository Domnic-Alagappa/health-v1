/**
 * Voice Command Indicator
 * Show when listening for voice commands
 */

import { Box } from "@/components/ui/box";
import { cn } from "@/lib/utils";
import { useVoiceCommandStore } from "@/stores/voiceCommandStore";
import { Mic } from "lucide-react";

export function VoiceCommandIndicator() {
  const isListening = useVoiceCommandStore((state) => state.isListening);
  const isProcessing = useVoiceCommandStore((state) => state.isProcessing);

  if (!isListening && !isProcessing) {
    return null;
  }

  return (
    <Box
      className={cn(
        "fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-md shadow-lg",
        isListening ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
      )}
      role="status"
      aria-live="polite"
      aria-label={isListening ? "Listening for voice commands" : "Processing voice command"}
    >
      <Mic className={cn("h-4 w-4", isListening && "animate-pulse")} />
      <span className="text-sm font-medium">{isListening ? "Listening..." : "Processing..."}</span>
    </Box>
  );
}
