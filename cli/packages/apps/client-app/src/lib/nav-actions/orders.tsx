import { Activity, FileText, Plus } from "lucide-react";
import type { NavAction } from "./types";

export function getOrdersActions(
  path: string,
  onAction: (actionId: string, navPath: string) => void
): NavAction[] {
  return [
    {
      id: "new-order",
      label: "New Order",
      icon: <Plus className="h-4 w-4" />,
      onClick: () => onAction("new-order", path),
    },
    {
      id: "pending-orders",
      label: "Pending Orders",
      icon: <Activity className="h-4 w-4" />,
      onClick: () => onAction("pending-orders", path),
    },
    {
      id: "order-history",
      label: "Order History",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onAction("order-history", path),
    },
  ];
}
