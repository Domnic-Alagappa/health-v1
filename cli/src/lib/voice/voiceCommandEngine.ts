/**
 * Voice Command Engine
 * Web Speech API integration for voice recognition
 */

import { useAccessibilityStore } from "@/stores/accessibilityStore"
import { useVoiceCommandStore } from "@/stores/voiceCommandStore"
import { getVoiceCommandExecutor } from "./voiceCommandExecutor"
import { getVoiceCommandParser } from "./voiceCommandParser"

export interface VoiceRecognitionOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  maxAlternatives?: number
}

export class VoiceCommandEngine {
  private recognition: SpeechRecognition | null = null
  private isSupported: boolean = false

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
      this.isSupported = !!SpeechRecognition

      if (this.isSupported) {
        this.recognition = new SpeechRecognition()
        this.setupRecognition()
      }
    }
  }

  private setupRecognition() {
    if (!this.recognition) return

    const preferences = useAccessibilityStore.getState().preferences

    this.recognition.lang = preferences.voiceCommandsLanguage || "en-US"
    this.recognition.continuous = true
    this.recognition.interimResults = false
    this.recognition.maxAlternatives = 1

    this.recognition.onstart = () => {
      useVoiceCommandStore.getState().startListening()
      useVoiceCommandStore.getState().setError(null)
    }

    this.recognition.onend = () => {
      // If still supposed to be listening, restart automatically
      // This handles cases where recognition ends due to silence
      const state = useVoiceCommandStore.getState()
      if (state.isListening) {
        // Small delay before restarting to avoid rapid restarts
        setTimeout(() => {
          if (useVoiceCommandStore.getState().isListening) {
            try {
              this.recognition?.start()
            } catch (err) {
              // Ignore restart errors (may already be running)
            }
          }
        }, 300)
      } else {
        useVoiceCommandStore.getState().stopListening()
      }
    }

    this.recognition.onerror = (event) => {
      const errorMessage = this.getErrorMessage(event.error)

      // For "no-speech" errors, don't show error immediately - just restart
      if (event.error === "no-speech") {
        // Silently restart recognition after a short delay
        setTimeout(() => {
          if (useVoiceCommandStore.getState().isListening) {
            try {
              this.recognition?.start()
            } catch (err) {
              // Ignore restart errors
            }
          }
        }, 500)
        return
      }

      // For other errors, show the error message
      useVoiceCommandStore.getState().setError(errorMessage)

      // Only stop listening for critical errors
      if (event.error === "not-allowed" || event.error === "audio-capture") {
        useVoiceCommandStore.getState().stopListening()
      }
    }

    this.recognition.onresult = (event) => {
      const lastResult = event.results[event.results.length - 1]
      const transcript = lastResult[0].transcript.trim()

      if (lastResult.isFinal) {
        useVoiceCommandStore.getState().setLastCommand(transcript)
        useVoiceCommandStore.getState().setProcessing(true)

        // Process command will be handled by voiceCommandParser
        this.handleCommand(transcript)
      }
    }
  }

  private getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      "no-speech": "No speech detected. Please try again.",
      "audio-capture": "Microphone not accessible. Please check your microphone permissions.",
      network: "Network error. Please check your connection.",
      aborted: "Recognition aborted.",
      "not-allowed": "Microphone permission denied. Please enable microphone access.",
    }

    return errorMessages[error] || `Recognition error: ${error}`
  }

  private async handleCommand(transcript: string) {
    try {
      console.log("Voice command received:", transcript)

      // Parse the command
      const parser = getVoiceCommandParser()
      const intent = parser.parse(transcript)

      if (!intent) {
        useVoiceCommandStore.getState().setError("Could not parse voice command")
        useVoiceCommandStore.getState().setProcessing(false)
        return
      }

      // Execute the command
      const executor = getVoiceCommandExecutor()
      const success = await executor.execute(intent)

      // Add to history
      useVoiceCommandStore.getState().addToHistory(transcript, intent.type, success)

      if (!success) {
        useVoiceCommandStore.getState().setError(`Failed to execute command: ${transcript}`)
      } else {
        // Clear any previous errors on success
        useVoiceCommandStore.getState().setError(null)
      }
    } catch (error) {
      console.error("Error handling voice command:", error)
      useVoiceCommandStore
        .getState()
        .setError(error instanceof Error ? error.message : "Failed to process voice command")
      useVoiceCommandStore.getState().addToHistory(transcript, "error", false)
    } finally {
      useVoiceCommandStore.getState().setProcessing(false)
    }
  }

  public start(options?: VoiceRecognitionOptions): void {
    if (!this.isSupported) {
      useVoiceCommandStore
        .getState()
        .setError("Voice recognition is not supported in this browser.")
      return
    }

    if (!this.recognition) {
      useVoiceCommandStore.getState().setError("Voice recognition is not initialized.")
      return
    }

    if (options) {
      if (options.language) this.recognition.lang = options.language
      if (options.continuous !== undefined) this.recognition.continuous = options.continuous
      if (options.interimResults !== undefined)
        this.recognition.interimResults = options.interimResults
      if (options.maxAlternatives !== undefined)
        this.recognition.maxAlternatives = options.maxAlternatives
    }

    try {
      this.recognition.start()
    } catch (error) {
      useVoiceCommandStore
        .getState()
        .setError("Failed to start voice recognition. It may already be running.")
    }
  }

  public stop(): void {
    if (this.recognition) {
      this.recognition.stop()
      useVoiceCommandStore.getState().stopListening()
    }
  }

  public abort(): void {
    if (this.recognition) {
      this.recognition.abort()
      useVoiceCommandStore.getState().stopListening()
    }
  }

  public isAvailable(): boolean {
    return this.isSupported
  }

  public setLanguage(language: string): void {
    if (this.recognition) {
      this.recognition.lang = language
    }
  }
}

// Text-to-Speech utility
export class TextToSpeechEngine {
  private synth: SpeechSynthesis | null = null
  private isSupported: boolean = false

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis
      this.isSupported = !!this.synth
    }
  }

  public speak(
    text: string,
    options?: {
      lang?: string
      pitch?: number
      rate?: number
      volume?: number
    }
  ): void {
    if (!this.isSupported || !this.synth) {
      console.warn("Text-to-speech is not supported in this browser.")
      return
    }

    // Cancel any ongoing speech
    this.synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    if (options) {
      if (options.lang) utterance.lang = options.lang
      if (options.pitch !== undefined) utterance.pitch = options.pitch
      if (options.rate !== undefined) utterance.rate = options.rate
      if (options.volume !== undefined) utterance.volume = options.volume
    }

    this.synth.speak(utterance)
  }

  public stop(): void {
    if (this.synth) {
      this.synth.cancel()
    }
  }

  public isAvailable(): boolean {
    return this.isSupported
  }
}

// Global instances
let voiceEngineInstance: VoiceCommandEngine | null = null
let ttsEngineInstance: TextToSpeechEngine | null = null

export function getVoiceCommandEngine(): VoiceCommandEngine {
  if (!voiceEngineInstance) {
    voiceEngineInstance = new VoiceCommandEngine()
  }
  return voiceEngineInstance
}

export function getTextToSpeechEngine(): TextToSpeechEngine {
  if (!ttsEngineInstance) {
    ttsEngineInstance = new TextToSpeechEngine()
  }
  return ttsEngineInstance
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

interface SpeechRecognition extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start(): void
  stop(): void
  abort(): void
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string
  message: string
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
  isFinal: boolean
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition
  new (): SpeechRecognition
}
