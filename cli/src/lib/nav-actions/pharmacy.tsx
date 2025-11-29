import { FileText, Pill, Plus } from "lucide-react"
import type { NavAction } from "./types"

export function getPharmacyActions(
  path: string,
  onAction: (actionId: string, navPath: string) => void
): NavAction[] {
  return [
    {
      id: "new-prescription",
      label: "New Prescription",
      icon: <Plus className="h-4 w-4" />,
      onClick: () => onAction("new-prescription", path),
    },
    {
      id: "view-medications",
      label: "Medications",
      icon: <Pill className="h-4 w-4" />,
      onClick: () => onAction("view-medications", path),
    },
    {
      id: "pharmacy-reports",
      label: "Pharmacy Reports",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onAction("pharmacy-reports", path),
    },
  ]
}
