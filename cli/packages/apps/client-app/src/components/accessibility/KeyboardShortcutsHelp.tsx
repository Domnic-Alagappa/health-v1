/**
 * Keyboard Shortcuts Help
 * Display available keyboard shortcuts
 */

import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Stack } from "@/components/ui/stack";
import { useDisclosure } from "@/hooks/ui/useDisclosure";
import { keyboardShortcutManager } from "@/lib/keyboard/shortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsHelpProps {
  showTrigger?: boolean;
}

export function KeyboardShortcutsHelp({ showTrigger = false }: KeyboardShortcutsHelpProps) {
  const { isOpen, onToggle } = useDisclosure("keyboard-shortcuts-help");
  const shortcuts = keyboardShortcutManager.getAllShortcuts();

  const formatKeys = (keys: string[]): string => {
    return keys
      .map((k) => {
        if (k.toLowerCase() === "ctrl") return "Ctrl";
        if (k.toLowerCase() === "alt") return "Alt";
        if (k.toLowerCase() === "shift") return "Shift";
        if (k.toLowerCase() === "meta") return "Cmd";
        return k;
      })
      .join(" + ");
  };

  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      const category = shortcut.category || "General";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(shortcut);
      return acc;
    },
    {} as Record<string, typeof shortcuts>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onToggle}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Show keyboard shortcuts"
            title="Keyboard Shortcuts (Alt+K)"
          >
            <Keyboard className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>

        <Stack spacing="lg" className="mt-4">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <Box key={category}>
              <h3 className="text-lg font-semibold mb-2">{category}</h3>
              <Stack spacing="sm">
                {categoryShortcuts.map((shortcut) => (
                  <Box
                    key={shortcut.id}
                    className="flex items-center justify-between py-2 border-b"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">
                      {formatKeys(shortcut.keys)}
                    </kbd>
                  </Box>
                ))}
              </Stack>
            </Box>
          ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
