import { RefreshCw, Settings } from "lucide-react";
import type { NavAction } from "./types";

export function getDashboardActions(
  path: string,
  onAction: (actionId: string, navPath: string) => void
): NavAction[] {
  return [
    {
      id: "refresh-dashboard",
      label: "Refresh",
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: () => onAction("refresh-dashboard", path),
    },
    {
      id: "dashboard-settings",
      label: "Dashboard Settings",
      icon: <Settings className="h-4 w-4" />,
      onClick: () => onAction("dashboard-settings", path),
    },
  ];
}
