/**
 * UI store types
 */

export interface UIState {
  sidebarCollapsed: boolean
  activeTabId: string | null
  sidebarExpandedItems: Set<string>
  disclosures: Record<string, boolean> // For modals, dialogs, dropdowns, etc.
  preferences: {
    showMaskedFields: boolean
    autoRefresh: boolean
    refreshInterval: number
  }
}

export interface UIActions {
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveTabId: (tabId: string | null) => void
  toggleSidebarExpand: (path: string) => void
  setSidebarExpandedItems: (items: Set<string>) => void
  openDisclosure: (id: string) => void
  closeDisclosure: (id: string) => void
  toggleDisclosure: (id: string) => void
  resetDisclosure: (id: string) => void
  updatePreferences: (preferences: Partial<UIState["preferences"]>) => void
  resetPreferences: () => void
}

export type UIStore = UIState & UIActions

