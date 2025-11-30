import { getAnalyticsActions } from "./analytics";
import { getClinicalActions } from "./clinical";
import { getDashboardActions } from "./dashboard";
import { getOrdersActions } from "./orders";
import { getPatientsActions } from "./patients";
import { getPharmacyActions } from "./pharmacy";
import { getResultsActions } from "./results";
import { getRevenueActions } from "./revenue";
import { getSchedulingActions } from "./scheduling";
import type { NavAction } from "./types";

/**
 * Get action items for navigation items
 * These appear below the nav item when expanded
 */
export function getNavActions(
  path: string,
  onAction: (actionId: string, navPath: string) => void
): NavAction[] {
  if (path === "/") {
    return getDashboardActions(path, onAction);
  }

  if (path.startsWith("/patients")) {
    return getPatientsActions(path, onAction);
  }

  if (path.startsWith("/clinical")) {
    return getClinicalActions(path, onAction);
  }

  if (path.startsWith("/orders")) {
    return getOrdersActions(path, onAction);
  }

  if (path.startsWith("/results")) {
    return getResultsActions(path, onAction);
  }

  if (path.startsWith("/scheduling")) {
    return getSchedulingActions(path, onAction);
  }

  if (path.startsWith("/pharmacy")) {
    return getPharmacyActions(path, onAction);
  }

  if (path.startsWith("/revenue")) {
    return getRevenueActions(path, onAction);
  }

  if (path.startsWith("/analytics")) {
    return getAnalyticsActions(path, onAction);
  }

  return [];
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
  ];
}

export type { NavAction } from "./types";
