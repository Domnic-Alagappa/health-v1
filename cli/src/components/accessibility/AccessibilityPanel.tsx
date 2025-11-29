/**
 * Accessibility Panel
 * Main accessibility settings panel
 */

import { Settings } from "lucide-react"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Stack } from "@/components/ui/stack"
import { useDisclosure } from "@/hooks/ui/useDisclosure"
import { useAccessibilityStore } from "@/stores/accessibilityStore"
import { ColorBlindModeSelector } from "./ColorBlindModeSelector"
import { FontSizeSelector } from "./FontSizeSelector"
import { HighContrastToggle } from "./HighContrastToggle"
import { VoiceCommandButton } from "./VoiceCommandButton"

interface AccessibilityPanelProps {
  showTrigger?: boolean
}

export function AccessibilityPanel({ showTrigger = false }: AccessibilityPanelProps) {
  const { isOpen, onOpen, onClose, onToggle } = useDisclosure("accessibility-panel")
  const preferences = useAccessibilityStore((state) => state.preferences)
  const resetPreferences = useAccessibilityStore((state) => state.resetPreferences)

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open accessibility settings"
            title="Accessibility Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Accessibility Settings</DialogTitle>
        </DialogHeader>

        <Stack spacing="lg" className="mt-4">
          {/* Visual Accessibility */}
          <Box>
            <h3 className="text-lg font-semibold mb-4">Visual Accessibility</h3>
            <Stack spacing="md">
              <HighContrastToggle />
              <FontSizeSelector />
              <ColorBlindModeSelector />
            </Stack>
          </Box>

          <Separator />

          {/* Voice Commands */}
          <Box>
            <h3 className="text-lg font-semibold mb-4">Voice Commands</h3>
            <Stack spacing="sm">
              <Box className="flex items-center justify-between">
                <label htmlFor="voice-enabled" className="text-sm">
                  Enable Voice Commands
                </label>
                <input
                  id="voice-enabled"
                  type="checkbox"
                  checked={preferences.voiceCommandsEnabled}
                  onChange={(e) =>
                    useAccessibilityStore
                      .getState()
                      .updatePreference("voiceCommandsEnabled", e.target.checked)
                  }
                  className="h-4 w-4"
                />
              </Box>
              {preferences.voiceCommandsEnabled && (
                <Box className="flex items-center gap-2">
                  <VoiceCommandButton />
                  <span className="text-xs text-muted-foreground">
                    Click to start/stop voice recognition
                  </span>
                </Box>
              )}
            </Stack>
          </Box>

          <Separator />

          {/* Screen Reader */}
          <Box>
            <h3 className="text-lg font-semibold mb-4">Screen Reader</h3>
            <Stack spacing="sm">
              <Box className="flex items-center justify-between">
                <label htmlFor="screen-reader-optimized" className="text-sm">
                  Screen Reader Optimized
                </label>
                <input
                  id="screen-reader-optimized"
                  type="checkbox"
                  checked={preferences.screenReaderOptimized}
                  onChange={(e) =>
                    useAccessibilityStore
                      .getState()
                      .updatePreference("screenReaderOptimized", e.target.checked)
                  }
                  className="h-4 w-4"
                />
              </Box>
              <Box className="flex items-center justify-between">
                <label htmlFor="announce-changes" className="text-sm">
                  Announce Page Changes
                </label>
                <input
                  id="announce-changes"
                  type="checkbox"
                  checked={preferences.announcePageChanges}
                  onChange={(e) =>
                    useAccessibilityStore
                      .getState()
                      .updatePreference("announcePageChanges", e.target.checked)
                  }
                  className="h-4 w-4"
                />
              </Box>
            </Stack>
          </Box>

          <Separator />

          {/* Actions */}
          <Box className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetPreferences}>
              Reset to Defaults
            </Button>
            <Button onClick={onClose}>Close</Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
