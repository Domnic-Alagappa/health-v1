/**
 * Voice Command Floating Action Button (FAB)
 * Shows a floating mic button when voice commands are enabled
 */

import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getVoiceCommandEngine } from "@/lib/voice/voiceCommandEngine";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { useVoiceCommandStore } from "@/stores/voiceCommandStore";
import { Mic, MicOff } from "lucide-react";

export function VoiceCommandFAB() {
  const preferences = useAccessibilityStore((state) => state.preferences);
  const isListening = useVoiceCommandStore((state) => state.isListening);
  const startListening = useVoiceCommandStore((state) => state.startListening);
  const stopListening = useVoiceCommandStore((state) => state.stopListening);
  const setError = useVoiceCommandStore((state) => state.setError);

  // Only show if voice commands are enabled
  if (!preferences.voiceCommandsEnabled) {
    return null;
  }

  const handleToggle = async () => {
    if (isListening) {
      stopListening();
      const engine = getVoiceCommandEngine();
      engine.stop();
    } else {
      try {
        // Request microphone permission first
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (permError) {
          setError(
            "Microphone permission denied. Please enable microphone access in your browser settings."
          );
          return;
        }

        const engine = getVoiceCommandEngine();
        if (!engine.isAvailable()) {
          setError("Voice recognition is not supported in this browser.");
          return;
        }

        engine.start({
          language: preferences.voiceCommandsLanguage || "en-US",
          continuous: true,
          interimResults: true,
        });
        startListening();
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to start voice recognition");
      }
    }
  };

  return (
    <Box
      className={cn("fixed bottom-24 right-6 z-50", "transition-all duration-300 ease-in-out")}
      role="button"
      aria-label={isListening ? "Stop voice commands" : "Start voice commands"}
    >
      <Button
        onClick={handleToggle}
        size="icon"
        className={cn(
          "h-12 w-12 rounded-full shadow-lg",
          "flex items-center justify-center",
          "transition-all duration-200",
          isListening
            ? "bg-destructive hover:bg-destructive/90 animate-pulse"
            : "bg-primary hover:bg-primary/90"
        )}
        aria-pressed={isListening}
      >
        {isListening ? (
          <MicOff className="h-4 w-4 text-white" aria-hidden="true" />
        ) : (
          <Mic className="h-4 w-4 text-white" aria-hidden="true" />
        )}
      </Button>
    </Box>
  );
}
