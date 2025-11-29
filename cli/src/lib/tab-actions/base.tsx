import { Copy, RefreshCw } from "lucide-react"
import type { TabAction } from "./types"

export function getBaseTabActions(
  path: string,
  onAction: (actionId: string, tabPath: string) => void
): TabAction[] {
  return [
    {
      id: "refresh",
      label: "Refresh",
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: () => onAction("refresh", path),
      shortcut: "Ctrl+R",
    },
    {
      id: "duplicate",
      label: "Duplicate Tab",
      icon: <Copy className="h-4 w-4" />,
      onClick: () => onAction("duplicate", path),
      shortcut: "Ctrl+D",
    },
  ]
}
