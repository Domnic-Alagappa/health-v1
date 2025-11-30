import {
  Activity,
  Calendar,
  Download,
  Edit,
  Eye,
  FileText,
  Link2,
  Pill,
  Printer,
  RefreshCw,
} from "lucide-react";
import { getBaseTabActions } from "./base";
import type { TabActionGroup } from "./types";

export function getPatientsTabActions(
  path: string,
  _label: string,
  onAction: (actionId: string, tabPath: string) => void
): TabActionGroup[] {
  const patientIdMatch = path.match(/\/patients\/(.+)$/);
  const patientId = patientIdMatch ? patientIdMatch[1] : null;
  const baseActions = getBaseTabActions(path, onAction);

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
    ];
  }

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
  ];
}
