import { Eye, FileText } from "lucide-react"
import { getBaseTabActions } from "./base"
import type { TabActionGroup } from "./types"

export function getOrdersTabActions(
  path: string,
  _label: string,
  onAction: (actionId: string, tabPath: string) => void
): TabActionGroup[] {
  const baseActions = getBaseTabActions(path, onAction)

  return [
    {
      actions: [
        {
          id: "new-order",
          label: "New Order",
          icon: <FileText className="h-4 w-4" />,
          onClick: () => onAction("new-order", path),
        },
        {
          id: "view-pending",
          label: "View Pending",
          icon: <Eye className="h-4 w-4" />,
          onClick: () => onAction("view-pending", path),
        },
      ],
    },
    {
      actions: baseActions,
    },
  ]
}
