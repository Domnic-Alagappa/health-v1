import { getBaseTabActions } from "./base"
import { getClinicalTabActions } from "./clinical"
import { getOrdersTabActions } from "./orders"
import { getPatientsTabActions } from "./patients"
import { getResultsTabActions } from "./results"
import type { TabActionGroup } from "./types"

/**
 * Get context menu actions for a tab based on its path
 * Similar to Excel's tab context menu
 */
export function getTabActions(
  path: string,
  label: string,
  onAction: (actionId: string, tabPath: string) => void
): TabActionGroup[] {
  if (path.startsWith("/patients")) {
    return getPatientsTabActions(path, label, onAction)
  }

  if (path.startsWith("/clinical")) {
    return getClinicalTabActions(path, label, onAction)
  }

  if (path.startsWith("/orders")) {
    return getOrdersTabActions(path, label, onAction)
  }

  if (path.startsWith("/results")) {
    return getResultsTabActions(path, label, onAction)
  }

  // Default actions for other tabs
  return [
    {
      actions: getBaseTabActions(path, onAction),
    },
  ]
}

export type { TabAction, TabActionGroup } from "./types"
