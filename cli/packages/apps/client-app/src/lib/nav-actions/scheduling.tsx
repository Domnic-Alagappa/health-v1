import { Calendar, Plus } from "lucide-react";
import type { NavAction } from "./types";

export function getSchedulingActions(
  path: string,
  onAction: (actionId: string, navPath: string) => void
): NavAction[] {
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
  ];
}
