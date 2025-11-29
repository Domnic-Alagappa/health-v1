import { FileText, Plus, RefreshCw, Search } from "lucide-react"
import type { NavAction } from "./types"

export function getPatientsActions(
  path: string,
  onAction: (actionId: string, navPath: string) => void
): NavAction[] {
  return [
    {
      id: "new-patient",
      label: "New Patient",
      icon: <Plus className="h-4 w-4" />,
      onClick: () => onAction("new-patient", path),
    },
    {
      id: "search-patients",
      label: "Search Patients",
      icon: <Search className="h-4 w-4" />,
      onClick: () => onAction("search-patients", path),
    },
    {
      id: "patient-reports",
      label: "Patient Reports",
      icon: <FileText className="h-4 w-4" />,
      onClick: () => onAction("patient-reports", path),
    },
    {
      id: "refresh-patients",
      label: "Refresh List",
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: () => onAction("refresh-patients", path),
    },
  ]
}
