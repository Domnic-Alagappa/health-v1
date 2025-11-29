/**
 * Voice Command Button
 * Toggle voice commands on/off
 */

import { Mic, MicOff } from "lucide-react"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { getVoiceCommandEngine } from "@/lib/voice/voiceCommandEngine"
import { getVoiceCommandExecutor } from "@/lib/voice/voiceCommandExecutor"
import { getVoiceCommandParser } from "@/lib/voice/voiceCommandParser"
import { useAccessibilityStore } from "@/stores/accessibilityStore"
import { useVoiceCommandStore } from "@/stores/voiceCommandStore"

export function VoiceCommandButton() {
  const preferences = useAccessibilityStore((state) => state.preferences)
  const isListening = useVoiceCommandStore((state) => state.isListening)
  const lastCommand = useVoiceCommandStore((state) => state.lastCommand)
  const setVoiceCommandActive = useAccessibilityStore((state) => state.setVoiceCommandActive)
  const setLastCommand = useVoiceCommandStore((state) => state.setLastCommand)

  const engineRef = useRef(getVoiceCommandEngine())
  const parserRef = useRef(getVoiceCommandParser())
  const executorRef = useRef(getVoiceCommandExecutor())
  const processedCommandRef = useRef<string | null>(null)

  useEffect(() => {
    if (!preferences.voiceCommandsEnabled) {
      engineRef.current.stop()
      return
    }

    if (isListening && lastCommand && lastCommand !== processedCommandRef.current) {
      // Parse and execute command
      processedCommandRef.current = lastCommand
      const intent = parserRef.current.parse(lastCommand)
      executorRef.current.execute(intent).then((success) => {
        if (success) {
          setVoiceCommandActive(true)
        }
        // Reset processed command after a delay
        setTimeout(() => {
          processedCommandRef.current = null
          setLastCommand(null)
        }, 1000)
      })
    }
  }, [
    isListening,
    lastCommand,
    preferences.voiceCommandsEnabled,
    setVoiceCommandActive,
    setLastCommand,
  ])

  if (!preferences.voiceCommandsEnabled) {
    return null
  }

  const handleToggle = () => {
    if (isListening) {
      engineRef.current.stop()
      setVoiceCommandActive(false)
    } else {
      engineRef.current.start({
        language: preferences.voiceCommandsLanguage || "en-US",
      })
      setVoiceCommandActive(true)
    }
  }

  return (
    <Button
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      onClick={handleToggle}
      aria-label={isListening ? "Stop voice commands" : "Start voice commands"}
      aria-pressed={isListening}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  )
}
