/**
 * Tab store types
 */

import type { ReactNode } from "react"
import type { Permission } from "../../constants/permissions"

export interface Tab {
  id: string
  label: string
  path: string
  icon?: ReactNode
  closable?: boolean
  allowDuplicate?: boolean // If true, allows multiple tabs with same path (for forms, etc.)
  requiredPermission?: Permission // Permission required to open this tab
  accessDenied?: boolean // True if access was denied
}

export interface TabState {
  tabs: Tab[]
  activeTabId: string | null
}

export interface TabActions {
  openTab: (tab: Omit<Tab, "id">, navigate?: (path: string) => void) => void
  closeTab: (tabId: string, navigate?: (path: string) => void) => void
  setActiveTab: (tabId: string, navigate?: (path: string) => void) => void
  closeAllTabs: (navigate?: (path: string) => void) => void
  reorderTabs: (draggedId: string, targetIndex: number) => void
  getTabById: (id: string) => Tab | undefined
  getTabByPath: (path: string) => Tab | undefined
}

export type TabStore = TabState & TabActions

