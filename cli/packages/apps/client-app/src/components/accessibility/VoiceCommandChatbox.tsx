/**
 * Voice Command Chatbox Floater
 * Displays a chatbox interface for voice command interaction
 */

import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MessageSquare, Mic, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getVoiceCommandEngine } from "@/lib/voice/voiceCommandEngine";
import { getVoiceCommandExecutor } from "@/lib/voice/voiceCommandExecutor";
import { getVoiceCommandParser } from "@/lib/voice/voiceCommandParser";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { useVoiceCommandStore } from "@/stores/voiceCommandStore";

interface ChatMessage {
  id: string;
  type: "user" | "system" | "error";
  content: string;
  timestamp: number;
}

export function VoiceCommandChatbox() {
  const preferences = useAccessibilityStore((state) => state.preferences);
  const isListening = useVoiceCommandStore((state) => state.isListening);
  const lastCommand = useVoiceCommandStore((state) => state.lastCommand);
  const error = useVoiceCommandStore((state) => state.error);
  const startListening = useVoiceCommandStore((state) => state.startListening);
  const stopListening = useVoiceCommandStore((state) => state.stopListening);
  const setError = useVoiceCommandStore((state) => state.setError);
  const addToHistory = useVoiceCommandStore((state) => state.addToHistory);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Only show if voice commands are enabled
  if (!preferences.voiceCommandsEnabled) {
    return null;
  }

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle voice command recognition
  useEffect(() => {
    if (lastCommand && isListening) {
      const newMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        type: "user",
        content: lastCommand,
        timestamp: Date.now(),
      };
      setMessages((prev: ChatMessage[]) => [...prev, newMessage]);

      // Parse and execute command
      try {
        const parser = getVoiceCommandParser();
        const executor = getVoiceCommandExecutor();
        const intent = parser.parse(lastCommand);

        if (intent) {
          executor.execute(intent);
          addToHistory(lastCommand, intent.type, true);

          // Add system response
          setTimeout(() => {
            const responseMessage: ChatMessage = {
              id: `msg-${Date.now()}`,
              type: "system",
              content: `Executed: ${intent.type}`,
              timestamp: Date.now(),
            };
            setMessages((prev: ChatMessage[]) => [...prev, responseMessage]);
          }, 500);
        }
      } catch (err) {
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          type: "error",
          content: err instanceof Error ? err.message : "Failed to execute command",
          timestamp: Date.now(),
        };
        setMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
        addToHistory(lastCommand, "error", false);
      }
    }
  }, [lastCommand, isListening, addToHistory]);

  // Handle errors
  useEffect(() => {
    if (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        type: "error",
        content: error,
        timestamp: Date.now(),
      };
      setMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
    }
  }, [error]);

  const handleToggleListening = async () => {
    if (isListening) {
      stopListening();
      const engine = getVoiceCommandEngine();
      engine.stop();
    } else {
      try {
        // Request microphone permission first
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (_permError) {
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
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start voice recognition");
      }
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: "user",
      content: inputValue,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");

    // Parse and execute command
    try {
      const parser = getVoiceCommandParser();
      const executor = getVoiceCommandExecutor();
      const intent = parser.parse(inputValue);

      if (intent) {
        executor.execute(intent);
        addToHistory(inputValue, intent.type, true);

        // Add system response
        setTimeout(() => {
          const responseMessage: ChatMessage = {
            id: `msg-${Date.now()}`,
            type: "system",
            content: `Executed: ${intent.type}`,
            timestamp: Date.now(),
          };
          setMessages((prev: ChatMessage[]) => [...prev, responseMessage]);
        }, 500);
      }
    } catch (err) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        type: "error",
        content: err instanceof Error ? err.message : "Failed to execute command",
        timestamp: Date.now(),
      };
      setMessages((prev: ChatMessage[]) => [...prev, errorMessage]);
      addToHistory(inputValue, "error", false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Box className={cn("fixed bottom-6 right-6 z-50", "transition-all duration-300 ease-in-out")}>
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg flex items-center justify-center"
          aria-label="Open voice command chatbox"
        >
          <MessageSquare className="h-6 w-6" aria-hidden="true" />
        </Button>
      </Box>
    );
  }

  return (
    <Box
      className={cn(
        "fixed bottom-6 right-6 z-50",
        "w-96 max-w-[calc(100vw-3rem)]",
        "transition-all duration-300 ease-in-out"
      )}
      role="dialog"
      aria-label="Voice command chatbox"
      aria-modal="false"
    >
      <Card className="shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <h3 className="text-lg font-semibold">Voice Commands</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            aria-label="Close chatbox"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <Box
            className="h-64 overflow-y-auto space-y-2 p-2 bg-muted/50 rounded-md"
            role="log"
            aria-live="polite"
            aria-label="Voice command messages"
          >
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Start speaking or type a command...
              </p>
            )}
            {messages.map((message: ChatMessage) => (
              <Box
                key={message.id}
                className={cn(
                  "p-2 rounded-md text-sm",
                  message.type === "user" && "bg-primary/10 ml-auto max-w-[80%]",
                  message.type === "system" && "bg-muted max-w-[80%]",
                  message.type === "error" && "bg-destructive/10 text-destructive max-w-[80%]"
                )}
              >
                <p>{message.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </Box>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* Input area */}
          <Box className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a command or use voice..."
              aria-label="Command input"
            />
            <Button
              onClick={handleToggleListening}
              variant={isListening ? "destructive" : "default"}
              size="icon"
              aria-label={isListening ? "Stop listening" : "Start listening"}
              aria-pressed={isListening}
            >
              <Mic className={cn("h-4 w-4", isListening && "animate-pulse")} />
            </Button>
            <Button onClick={handleSendMessage} size="icon" aria-label="Send command">
              <Send className="h-4 w-4" />
            </Button>
          </Box>

          {/* Status indicator */}
          {isListening && (
            <Box className="text-xs text-center text-muted-foreground">
              <span className="inline-block w-2 h-2 bg-primary rounded-full animate-pulse mr-2" />
              Listening...
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
