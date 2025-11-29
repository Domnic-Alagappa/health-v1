import {
  Activity,
  Calendar,
  Download,
  FileText,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Settings,
} from "lucide-react"
import type { ReactNode } from "react"

export interface NavAction {
  id: string
  label: string
  icon?: ReactNode
  onClick: () => void
  disabled?: boolean
}

/**
 * Get action items for navigation items
 * These appear below the nav item when expanded
 */
export function getNavActions(
  path: string,
  onAction: (actionId: string, navPath: string) => void
): NavAction[] {
  if (path === "/") {
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
    ]
  }

  if (path.startsWith("/patients")) {
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

  if (path.startsWith("/clinical")) {
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

  if (path.startsWith("/orders")) {
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
    ]
  }

  if (path.startsWith("/results")) {
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

  if (path.startsWith("/scheduling")) {
    return [
      {
        id: "new-appointment",
        label: "New Appointment",
        icon: <Plus className="h-4 w-4" />,
        onClick: () => onAction("new-appointment", path),
      },
      {
        id: "today-schedule",
        label: "Today's Schedule",
        icon: <Calendar className="h-4 w-4" />,
        onClick: () => onAction("today-schedule", path),
      },
      {
        id: "calendar-view",
        label: "Calendar View",
        icon: <Calendar className="h-4 w-4" />,
        onClick: () => onAction("calendar-view", path),
      },
    ]
  }

  if (path.startsWith("/pharmacy")) {
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

  if (path.startsWith("/revenue")) {
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
    ]
  }

  if (path.startsWith("/analytics")) {
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
    ]
  }

  return []
}

/**
 * Get context menu actions for navigation items
 */
export function getNavContextActions(
  path: string,
  onAction: (actionId: string, navPath: string) => void
) {
  return [
    {
      id: "open-new-tab",
      label: "Open in New Tab",
      onClick: () => onAction("open-new-tab", path),
    },
    {
      id: "pin",
      label: "Pin to Sidebar",
      onClick: () => onAction("pin", path),
    },
    {
      id: "refresh",
      label: "Refresh",
      onClick: () => onAction("refresh", path),
    },
  ]
}
