/**
 * Voice Selector
 * Select TTS voice with accent/quality options
 */

import { Box } from "@/components/ui/box";
import { Stack } from "@/components/ui/stack";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { useEffect, useState } from "react";

interface Voice {
  name: string;
  lang: string;
  default?: boolean;
  localService?: boolean;
  voiceURI: string;
}

export function VoiceSelector() {
  const preferences = useAccessibilityStore((state) => state.preferences);
  const updatePreference = useAccessibilityStore((state) => state.updatePreference);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load available voices
    const loadVoices = () => {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        setLoading(false);
        return;
      }

      // Voices may not be immediately available, so we need to wait
      const synth = window.speechSynthesis;
      let voicesList = synth.getVoices();

      if (voicesList.length === 0) {
        // Voices might load asynchronously
        synth.onvoiceschanged = () => {
          voicesList = synth.getVoices();
          setVoices(voicesList);
          setLoading(false);
        };
      } else {
        setVoices(voicesList);
        setLoading(false);
      }
    };

    loadVoices();
  }, []);

  // Filter voices by language and quality
  const filteredVoices = voices.filter((voice) => {
    // Filter by language if specified
    if (preferences.voiceCommandsLanguage) {
      const langPrefix = preferences.voiceCommandsLanguage.split("-")[0];
      return voice.lang.toLowerCase().startsWith(langPrefix.toLowerCase());
    }
    return true;
  });

  // Group voices by accent/quality
  const groupedVoices = filteredVoices.reduce(
    (acc, voice) => {
      // Extract accent/quality from voice name
      const name = voice.name.toLowerCase();
      let category = "Other";

      // Categorize voices by common patterns
      if (name.includes("premium") || name.includes("enhanced") || name.includes("neural")) {
        category = "Premium";
      } else if (name.includes("us") || name.includes("american")) {
        category = "American English";
      } else if (name.includes("gb") || name.includes("british") || name.includes("uk")) {
        category = "British English";
      } else if (name.includes("australian") || name.includes("au")) {
        category = "Australian English";
      } else if (name.includes("canadian") || name.includes("ca")) {
        category = "Canadian English";
      } else if (name.includes("indian") || name.includes("in")) {
        category = "Indian English";
      } else if (name.includes("irish") || name.includes("ie")) {
        category = "Irish English";
      } else if (name.includes("south african") || name.includes("za")) {
        category = "South African English";
      } else if (name.includes("female") || name.includes("woman")) {
        category = "Female Voices";
      } else if (name.includes("male") || name.includes("man")) {
        category = "Male Voices";
      }

      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(voice);
      return acc;
    },
    {} as Record<string, Voice[]>
  );

  // Sort categories by priority
  const categoryOrder = [
    "Premium",
    "American English",
    "British English",
    "Australian English",
    "Canadian English",
    "Indian English",
    "Irish English",
    "South African English",
    "Female Voices",
    "Male Voices",
    "Other",
  ];

  const sortedCategories = categoryOrder.filter((cat) => groupedVoices[cat]);

  // Set default voice if not set
  useEffect(() => {
    if (!preferences.voiceName && filteredVoices.length > 0) {
      // Try to find a good default voice
      const defaultVoice =
        filteredVoices.find((v) => v.default) ||
        filteredVoices.find((v) => v.name.toLowerCase().includes("premium")) ||
        filteredVoices.find((v) => v.name.toLowerCase().includes("enhanced")) ||
        filteredVoices.find((v) => v.name.toLowerCase().includes("neural")) ||
        filteredVoices[0];

      if (defaultVoice) {
        updatePreference("voiceName", defaultVoice.name);
      }
    }
  }, [filteredVoices, preferences.voiceName, updatePreference]);

  if (loading) {
    return (
      <Box>
        <p className="text-sm text-muted-foreground">Loading available voices...</p>
      </Box>
    );
  }

  if (filteredVoices.length === 0) {
    return (
      <Box>
        <p className="text-sm text-muted-foreground">
          No voices available for the selected language.
        </p>
      </Box>
    );
  }

  return (
    <Stack spacing="md">
      {/* Voice Selection */}
      <Box>
        <label htmlFor="voice-select" className="text-sm font-medium mb-2 block">
          Voice / Accent
        </label>
        <select
          id="voice-select"
          value={preferences.voiceName || ""}
          onChange={(e) => updatePreference("voiceName", e.target.value || null)}
          className="w-full p-2 border rounded-md bg-background"
        >
          {sortedCategories.map((category) => (
            <optgroup key={category} label={category}>
              {groupedVoices[category]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((voice) => (
                  <option key={voice.voiceURI} value={voice.name}>
                    {voice.name} {voice.default ? "(Default)" : ""}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Choose a voice with your preferred accent and quality
        </p>
      </Box>

      {/* Voice Settings */}
      <Box>
        <label className="text-sm font-medium mb-2 block">Voice Speed</label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={preferences.voiceRate}
          onChange={(e) => updatePreference("voiceRate", Number.parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Slow (0.5x)</span>
          <span>Normal (1.0x)</span>
          <span>Fast (2.0x)</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Current: {preferences.voiceRate}x</p>
      </Box>

      <Box>
        <label className="text-sm font-medium mb-2 block">Voice Pitch</label>
        <input
          type="range"
          min="0.5"
          max="2.0"
          step="0.1"
          value={preferences.voicePitch}
          onChange={(e) => updatePreference("voicePitch", Number.parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Low (0.5)</span>
          <span>Normal (1.0)</span>
          <span>High (2.0)</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Current: {preferences.voicePitch}</p>
      </Box>

      <Box>
        <label className="text-sm font-medium mb-2 block">Volume</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={preferences.voiceVolume}
          onChange={(e) => updatePreference("voiceVolume", Number.parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Quiet (0%)</span>
          <span>Normal (50%)</span>
          <span>Loud (100%)</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Current: {Math.round(preferences.voiceVolume * 100)}%
        </p>
      </Box>

      {/* Test Voice Button */}
      <Box>
        <button
          type="button"
          onClick={() => {
            const synth = window.speechSynthesis;
            const utterance = new SpeechSynthesisUtterance(
              "This is a test of the selected voice. How does it sound?"
            );

            if (preferences.voiceName) {
              const selectedVoice = voices.find((v) => v.name === preferences.voiceName);
              if (selectedVoice) {
                utterance.voice = selectedVoice;
              }
            }

            utterance.pitch = preferences.voicePitch;
            utterance.rate = preferences.voiceRate;
            utterance.volume = preferences.voiceVolume;
            utterance.lang = preferences.voiceCommandsLanguage || "en-US";

            synth.speak(utterance);
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
        >
          Test Voice
        </button>
      </Box>
    </Stack>
  );
}
