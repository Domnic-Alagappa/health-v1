/**
 * Voice Command Demo
 * Demonstrates voice command interaction with patient "John Doe"
 */

import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { registerComponent } from "@/components/ui/component-registry";
import { Stack } from "@/components/ui/stack";
import { getVoiceCommandExecutor } from "@/lib/voice/voiceCommandExecutor";
import { getVoiceCommandParser } from "@/lib/voice/voiceCommandParser";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { useOpenTab } from "@/stores/tabStore";
import { useVoiceCommandStore } from "@/stores/voiceCommandStore";
import { useNavigate } from "@tanstack/react-router";
import { User } from "lucide-react";
import { useEffect } from "react";

export function VoiceCommandDemo() {
  const navigate = useNavigate();
  const openTab = useOpenTab();
  const preferences = useAccessibilityStore((state) => state.preferences);
  const isListening = useVoiceCommandStore((state) => state.isListening);
  const lastCommand = useVoiceCommandStore((state) => state.lastCommand);

  // Register demo component with voice commands
  useEffect(() => {
    registerComponent("voice-command-demo", {
      ariaLabel: "Voice Command Demo",
      voiceInteractable: true,
      voiceDescription: "Demo page showing voice command capabilities with patient John Doe",

      actionItems: [
        {
          id: "open-john-doe",
          label: "Open Patient John Doe",
          voiceCommand: [
            "open john doe",
            "open patient john doe",
            "show john doe",
            "view john doe",
            "john doe patient",
          ],
          action: () => {
            openTab(
              {
                label: "John Doe (MRN-123456)",
                path: "/patients/john-doe-123",
                icon: <User className="h-4 w-4" />,
                closable: true,
              },
              (path) => navigate({ to: path as "/" | (string & {}) })
            );
          },
        },
      ],
    });
  }, [openTab, navigate]);

  // Handle voice commands
  useEffect(() => {
    if (preferences.voiceCommandsEnabled && isListening && lastCommand) {
      const parser = getVoiceCommandParser();
      const executor = getVoiceCommandExecutor();

      const intent = parser.parse(lastCommand);

      // Check if command is to open John Doe
      if (intent) {
        if (
          intent.type === "navigate" &&
          (intent.target?.toLowerCase().includes("john") ||
            intent.target?.toLowerCase().includes("doe") ||
            lastCommand.toLowerCase().includes("john doe"))
        ) {
          openTab(
            {
              label: "John Doe (MRN-123456)",
              path: "/patients/john-doe-123",
              icon: <User className="h-4 w-4" />,
              closable: true,
            },
            (path) => navigate({ to: path as "/" | (string & {}) })
          );
        } else {
          executor.execute(intent);
        }
      }
    }
  }, [isListening, lastCommand, preferences.voiceCommandsEnabled, openTab, navigate]);

  const handleOpenJohnDoe = () => {
    openTab(
      {
        label: "John Doe (MRN-123456)",
        path: "/patients/john-doe-123",
        icon: <User className="h-4 w-4" />,
        closable: true,
      },
      (path) => navigate({ to: path as "/" | (string & {}) })
    );
  };

  return (
    <Box className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Voice Command Demo - Patient John Doe</CardTitle>
        </CardHeader>
        <CardContent>
          <Stack spacing="lg">
            <Box>
              <h3 className="text-lg font-semibold mb-2">Try These Voice Commands:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>"Open John Doe"</li>
                <li>"Open patient John Doe"</li>
                <li>"Show John Doe"</li>
                <li>"View John Doe patient"</li>
              </ul>
            </Box>

            <Box>
              <h3 className="text-lg font-semibold mb-2">Or Click the Button:</h3>
              <Button onClick={handleOpenJohnDoe} aria-label="Open patient John Doe">
                <User className="mr-2 h-4 w-4" />
                Open John Doe (MRN-123456)
              </Button>
            </Box>

            {isListening && (
              <Box className="p-4 bg-primary/10 rounded-md">
                <p className="text-sm font-medium">Listening for voice commands...</p>
                {lastCommand && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last command: "{lastCommand}"
                  </p>
                )}
              </Box>
            )}

            {!preferences.voiceCommandsEnabled && (
              <Box className="p-4 bg-warning/10 rounded-md">
                <p className="text-sm">
                  Voice commands are disabled. Enable them in Accessibility Settings.
                </p>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
