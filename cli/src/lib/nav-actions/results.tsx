import { Activity, Download, FileText } from "lucide-react"
import type { NavAction } from "./types"

export function getResultsActions(
  path: string,
  onAction: (actionId: string, navPath: string) => void
): NavAction[] {
  return [
    {
      id: "pending-review",
      label: "Pending Review",
      icon: <Activity className="h-4 w-4" />,
      onClick: () => onAction("pending-review", path),
    },
    {
      id: "export-results",
      label: "Export Results",
      icon: <Download className="h-4 w-4" />,
      onClick: () => onAction("export-results", path),
    },
    {
      id: "result-reports",
      label: "Result Reports",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onAction("result-reports", path),
    },
  ]
}
