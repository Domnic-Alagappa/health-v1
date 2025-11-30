import { FileText, Printer } from "lucide-react";
import { getBaseTabActions } from "./base";
import type { TabActionGroup } from "./types";

export function getClinicalTabActions(
  path: string,
  _label: string,
  onAction: (actionId: string, tabPath: string) => void
): TabActionGroup[] {
  const baseActions = getBaseTabActions(path, onAction);

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
  ];
}
