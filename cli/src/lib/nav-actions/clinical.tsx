import { FileText, Plus } from "lucide-react"
import type { NavAction } from "./types"

export function getClinicalActions(
  path: string,
  onAction: (actionId: string, navPath: string) => void
): NavAction[] {
  return [
    {
      id: "new-note",
      label: "New Note",
      icon: <Plus className="h-4 w-4" />,
      onClick: () => onAction("new-note", path),
    },
    {
      id: "view-templates",
      label: "Templates",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onAction("view-templates", path),
    },
    {
      id: "clinical-reports",
      label: "Clinical Reports",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onAction("clinical-reports", path),
    },
  ]
}
