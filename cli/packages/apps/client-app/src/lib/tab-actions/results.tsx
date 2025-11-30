import { Download, Eye } from "lucide-react";
import { getBaseTabActions } from "./base";
import type { TabActionGroup } from "./types";

export function getResultsTabActions(
  path: string,
  _label: string,
  onAction: (actionId: string, tabPath: string) => void
): TabActionGroup[] {
  const baseActions = getBaseTabActions(path, onAction);

  return [
    {
      actions: [
        {
          id: "view-pending",
          label: "View Pending Review",
          icon: <Eye className="h-4 w-4" />,
          onClick: () => onAction("view-pending", path),
        },
        {
          id: "export",
          label: "Export Results",
          icon: <Download className="h-4 w-4" />,
          onClick: () => onAction("export", path),
        },
      ],
    },
    {
      actions: baseActions,
    },
  ];
}
