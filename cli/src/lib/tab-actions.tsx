import {
  Activity,
  Calendar,
  Copy,
  Download,
  Edit,
  Eye,
  FileText,
  Link2,
  Pill,
  Printer,
  RefreshCw,
} from "lucide-react"
import type { ReactNode } from "react"

export interface TabAction {
  id: string
  label: string
  icon?: ReactNode
  onClick: () => void
  disabled?: boolean
  shortcut?: string
}

export interface TabActionGroup {
  label?: string
  actions: TabAction[]
}

/**
 * Get context menu actions for a tab based on its path
 * Similar to Excel's tab context menu
 */
export function getTabActions(
  path: string,
  _label: string,
  onAction: (actionId: string, tabPath: string) => void
): TabActionGroup[] {
  // Extract patient ID if it's a patient detail route
  const patientIdMatch = path.match(/\/patients\/(.+)$/)
  const patientId = patientIdMatch ? patientIdMatch[1] : null

  // Base actions available for all tabs
  const baseActions: TabAction[] = [
    {
      id: "refresh",
      label: "Refresh",
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: () => onAction("refresh", path),
      shortcut: "Ctrl+R",
    },
    {
      id: "duplicate",
      label: "Duplicate Tab",
      icon: <Copy className="h-4 w-4" />,
      onClick: () => onAction("duplicate", path),
      shortcut: "Ctrl+D",
    },
  ]

  // Patient-specific actions
  if (path.startsWith("/patients")) {
    if (patientId) {
      // Patient detail page actions
      return [
        {
          actions: [
            {
              id: "view-details",
              label: "View Full Details",
              icon: <Eye className="h-4 w-4" />,
              onClick: () => onAction("view-details", path),
            },
            {
              id: "edit-patient",
              label: "Edit Patient",
              icon: <Edit className="h-4 w-4" />,
              onClick: () => onAction("edit-patient", path),
            },
            {
              id: "link-actions",
              label: "Linked Actions",
              icon: <Link2 className="h-4 w-4" />,
              onClick: () => onAction("link-actions", path),
            },
          ],
        },
        {
          actions: [
            {
              id: "new-note",
              label: "New Clinical Note",
              icon: <FileText className="h-4 w-4" />,
              onClick: () => onAction("new-note", path),
            },
            {
              id: "schedule",
              label: "Schedule Appointment",
              icon: <Calendar className="h-4 w-4" />,
              onClick: () => onAction("schedule", path),
            },
            {
              id: "view-results",
              label: "View Results",
              icon: <Activity className="h-4 w-4" />,
              onClick: () => onAction("view-results", path),
            },
            {
              id: "view-medications",
              label: "View Medications",
              icon: <Pill className="h-4 w-4" />,
              onClick: () => onAction("view-medications", path),
            },
          ],
        },
        {
          actions: [
            {
              id: "print",
              label: "Print",
              icon: <Printer className="h-4 w-4" />,
              onClick: () => onAction("print", path),
              shortcut: "Ctrl+P",
            },
            {
              id: "export",
              label: "Export to PDF",
              icon: <Download className="h-4 w-4" />,
              onClick: () => onAction("export", path),
            },
          ],
        },
        {
          actions: baseActions,
        },
      ]
    } else {
      // Patients list page
      return [
        {
          actions: [
            {
              id: "new-patient",
              label: "New Patient",
              icon: <FileText className="h-4 w-4" />,
              onClick: () => onAction("new-patient", path),
            },
            {
              id: "refresh",
              label: "Refresh List",
              icon: <RefreshCw className="h-4 w-4" />,
              onClick: () => onAction("refresh", path),
            },
          ],
        },
        {
          actions: baseActions.filter((a) => a.id !== "refresh"),
        },
      ]
    }
  }

  // Clinical actions
  if (path.startsWith("/clinical")) {
    return [
      {
        actions: [
          {
            id: "new-note",
            label: "New Note",
            icon: <FileText className="h-4 w-4" />,
            onClick: () => onAction("new-note", path),
          },
          {
            id: "view-templates",
            label: "View Templates",
            icon: <FileText className="h-4 w-4" />,
            onClick: () => onAction("view-templates", path),
          },
        ],
      },
      {
        actions: [
          {
            id: "print",
            label: "Print",
            icon: <Printer className="h-4 w-4" />,
            onClick: () => onAction("print", path),
          },
          ...baseActions,
        ],
      },
    ]
  }

  // Orders actions
  if (path.startsWith("/orders")) {
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

  // Results actions
  if (path.startsWith("/results")) {
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
    ]
  }

  // Default actions for other tabs
  return [
    {
      actions: baseActions,
    },
  ]
}
