/**
 * Voice Command Feedback
 * Display recognized commands and feedback
 */

import { Box } from "@/components/ui/box";
import { cn } from "@/lib/utils";
import { useVoiceCommandStore } from "@/stores/voiceCommandStore";

export function VoiceCommandFeedback() {
  const lastCommand = useVoiceCommandStore((state) => state.lastCommand);
  const lastIntent = useVoiceCommandStore((state) => state.lastIntent);
  const error = useVoiceCommandStore((state) => state.error);

  if (!lastCommand && !error) {
    return null;
  }

  return (
    <Box
      className={cn(
        "fixed bottom-4 right-4 z-50 px-4 py-2 rounded-md shadow-lg max-w-md",
        error ? "bg-destructive text-destructive-foreground" : "bg-card border"
      )}
      role="status"
      aria-live="polite"
    >
      {error ? (
        <div>
          <p className="text-sm font-medium">Error</p>
          <p className="text-xs">{error}</p>
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground">Command recognized</p>
          <p className="text-sm font-medium">{lastCommand}</p>
          {lastIntent && <p className="text-xs text-muted-foreground">Intent: {lastIntent}</p>}
        </div>
      )}
    </Box>
  );
}
