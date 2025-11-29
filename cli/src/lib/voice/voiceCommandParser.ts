/**
 * Voice Command Parser
 * Parse voice commands to intents and actions
 */

import { useVoiceCommandStore } from "@/stores/voiceCommandStore"

export interface VoiceIntent {
  type: string
  action: string
  target?: string
  value?: string
  parameters?: Record<string, unknown>
  confidence: number
}

export class VoiceCommandParser {
  private intents: Map<string, RegExp> = new Map()

  constructor() {
    this.initializeIntents()
  }

  private initializeIntents() {
    // Navigation intents - more specific patterns first
    this.intents.set(
      "open_patient",
      /^(open|show|view|display)\s+(?:patient\s+)?(?:record\s+)?(.+)$/i
    )
    this.intents.set("navigate", /^(go to|navigate to|open|show|display)\s+(.+)$/i)
    this.intents.set("go_back", /^(go back|back|previous|return)$/i)
    this.intents.set("go_forward", /^(go forward|forward|next)$/i)

    // Form intents
    this.intents.set(
      "fill_form",
      /^(fill|complete|fill out|fill in)\s+(?:the\s+)?(?:form|this form)$/i
    )
    this.intents.set("submit_form", /^(submit|submit form|send|send form)$/i)
    this.intents.set("clear_form", /^(clear|reset|clear form|reset form)$/i)

    // Button intents
    this.intents.set("click_button", /^(click|press|tap|activate)\s+(.+)$/i)
    this.intents.set("click_submit", /^(click submit|press submit|submit)$/i)
    this.intents.set("click_cancel", /^(click cancel|press cancel|cancel)$/i)
    this.intents.set("click_save", /^(click save|press save|save)$/i)
    this.intents.set("click_delete", /^(click delete|press delete|delete)$/i)

    // Dropdown intents
    this.intents.set("select_option", /^(select|choose|pick)\s+(.+)\s+(?:from|in)\s+(.+)$/i)

    // Table intents
    this.intents.set("sort_table", /^(sort|order)\s+(?:by\s+)?(.+)$/i)
    this.intents.set("filter_table", /^(filter|show only)\s+(.+)$/i)

    // Modal/Dialog intents
    this.intents.set("open_modal", /^(open|show)\s+(.+)$/i)
    this.intents.set("close_modal", /^(close|dismiss|cancel)\s+(?:the\s+)?(?:modal|dialog|popup)$/i)

    // General actions
    this.intents.set("search", /^(search|find|look for)\s+(?:for\s+)?(.+)$/i)
    this.intents.set("help", /^(help|what can i do|what commands|show help)$/i)
    this.intents.set("stop", /^(stop|stop listening|cancel|abort)$/i)
  }

  public parse(command: string): VoiceIntent | null {
    const normalizedCommand = command.trim().toLowerCase()

    // Try to match against known intents
    for (const [intentType, pattern] of this.intents.entries()) {
      const match = command.match(pattern)
      if (match) {
        return this.buildIntent(intentType, command, match)
      }
    }

    // If no pattern matches, return a generic intent
    return {
      type: "unknown",
      action: "unknown",
      confidence: 0.5,
    }
  }

  private buildIntent(type: string, originalCommand: string, match: RegExpMatchArray): VoiceIntent {
    const intent: VoiceIntent = {
      type,
      action: type,
      confidence: 0.8,
    }

    // Extract parameters based on intent type
    switch (type) {
      case "open_patient":
        intent.target = match[2]?.trim() // Patient name or ID
        intent.action = "open_patient"
        break
      case "navigate":
        intent.target = match[2]?.trim()
        break
      case "click_button":
        intent.target = match[2]?.trim()
        break
      case "select_option":
        intent.value = match[2]?.trim()
        intent.target = match[3]?.trim()
        break
      case "sort_table":
        intent.target = match[2]?.trim()
        break
      case "filter_table":
        intent.value = match[2]?.trim()
        break
      case "open_modal":
        intent.target = match[2]?.trim()
        break
      case "search":
        intent.value = match[2]?.trim()
        break
    }

    return intent
  }

  public addCustomIntent(name: string, pattern: RegExp): void {
    this.intents.set(name, pattern)
  }

  public getAvailableIntents(): string[] {
    return Array.from(this.intents.keys())
  }
}

// Global instance
let parserInstance: VoiceCommandParser | null = null

export function getVoiceCommandParser(): VoiceCommandParser {
  if (!parserInstance) {
    parserInstance = new VoiceCommandParser()
  }
  return parserInstance
}
