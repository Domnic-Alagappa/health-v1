import { FileText } from "lucide-react";
import type { NavAction } from "./types";

export function getRevenueActions(
  path: string,
  onAction: (actionId: string, navPath: string) => void
): NavAction[] {
  return [
    {
      id: "billing",
      label: "Billing",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onAction("billing", path),
    },
    {
      id: "revenue-reports",
      label: "Revenue Reports",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onAction("revenue-reports", path),
    },
    {
      id: "financial-summary",
      label: "Financial Summary",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onAction("financial-summary", path),
    },
  ];
}
