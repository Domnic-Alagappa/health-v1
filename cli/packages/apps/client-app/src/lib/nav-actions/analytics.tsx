import { Download, FileText, Plus } from "lucide-react";
import type { NavAction } from "./types";

export function getAnalyticsActions(
  path: string,
  onAction: (actionId: string, navPath: string) => void
): NavAction[] {
  return [
    {
      id: "create-report",
      label: "Create Report",
      icon: <Plus className="h-4 w-4" />,
      onClick: () => onAction("create-report", path),
    },
    {
      id: "saved-reports",
      label: "Saved Reports",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onAction("saved-reports", path),
    },
    {
      id: "export-data",
      label: "Export Data",
      icon: <Download className="h-4 w-4" />,
      onClick: () => onAction("export-data", path),
    },
  ];
}
