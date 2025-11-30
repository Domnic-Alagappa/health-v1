/**
 * Tab Store
 * Manages application tabs state using Zustand
 * Migrated from TabContext to use Zustand with atomic selectors
 */

import type { ReactNode } from "react"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { logAccessDenied } from "@/lib/api/audit"
import type { Permission } from "@health-v1/shared/constants/permissions"
import { reorderTabsArray } from "@/lib/dragUtils"
import { canAccessRoute, getRoutePermission } from "@/lib/navigation/permissionChecks"
import { useAuditStore } from "@/stores/auditStore"
import { useAuthStore } from "@/stores/authStore"

import type { Tab, TabState, TabActions, TabStore } from "@health-v1/shared/types/stores/tab"

// Re-export types
export type { Tab, TabState, TabActions, TabStore }

// Maximum number of tabs to prevent memory issues
const MAX_TABS = 50
const DASHBOARD_ID = "dashboard"

const initialState: TabState = {
  tabs: [
    {
      id: DASHBOARD_ID,
      label: "Dashboard",
      path: "/",
      closable: false,
    },
  ],
  activeTabId: DASHBOARD_ID,
}

export const useTabStore = create<TabStore>()(
  immer((set, get) => ({
    ...initialState,

    getTabById: (id: string) => {
      return get().tabs.find((tab) => tab.id === id)
    },

    getTabByPath: (path: string) => {
      return get().tabs.find(
        (tab) => tab.path === path && tab.id !== DASHBOARD_ID && !tab.accessDenied
      )
    },

    openTab: (tab: Omit<Tab, "id">, navigate?: (path: string) => void) => {
      // Check permission before opening tab
      const authState = useAuthStore.getState()
      const checkPermission = (permission: Permission): boolean => {
        return authState.permissions.includes(permission)
      }

      const requiredPermission = tab.requiredPermission || getRoutePermission(tab.path)
      const hasAccess = requiredPermission
        ? checkPermission(requiredPermission)
        : canAccessRoute(tab.path, checkPermission)

      if (!hasAccess && requiredPermission) {
        // Log access denied
        if (authState.user) {
          const { addEntry } = useAuditStore.getState()
          addEntry({
            userId: authState.user.id,
            action: "ACCESS_DENIED",
            resource: tab.path,
            details: {
              requiredPermission,
              userRole: authState.user.role,
            },
          })
          logAccessDenied(authState.user.id, tab.path, requiredPermission, authState.user.role)
        }

        // Create access denied tab instead
        const accessDeniedTab: Tab = {
          id: `access-denied-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          label: `Access Denied: ${tab.label}`,
          path: tab.path,
          closable: true,
          accessDenied: true,
          requiredPermission: tab.requiredPermission,
        }

        set((state) => {
          const dashboard = state.tabs[0]?.id === DASHBOARD_ID ? state.tabs[0] : null
          const otherTabs = dashboard ? state.tabs.slice(1) : state.tabs
          state.tabs = dashboard
            ? [dashboard, accessDeniedTab, ...otherTabs]
            : [accessDeniedTab, ...otherTabs]
          state.activeTabId = accessDeniedTab.id
        })

        if (navigate) {
          navigate(tab.path)
        }
        return
      }

      set((state) => {
        // If duplicates are not allowed (default), check if tab with same path exists
        // If it exists, just switch to it instead of creating a duplicate
        if (!tab.allowDuplicate) {
          const existing = state.tabs.find(
            (t) => t.path === tab.path && t.id !== DASHBOARD_ID && !t.accessDenied
          )
          if (existing) {
            // Tab exists and duplicates not allowed - switch to existing tab
            state.activeTabId = existing.id
            if (navigate) {
              navigate(tab.path)
            }
            return
          }
        }

        // If duplicates are allowed, count existing tabs with same path for numbering
        let label = tab.label
        if (tab.allowDuplicate) {
          const tabsWithSamePath = state.tabs.filter(
            (t) => t.path === tab.path && t.id !== DASHBOARD_ID
          )
          const duplicateCount = tabsWithSamePath.length
          if (duplicateCount > 0) {
            label = `${tab.label} (${duplicateCount})`
          }
        }

        // Limit max tabs for performance - auto-close oldest tabs
        if (state.tabs.length >= MAX_TABS) {
          // Remove oldest closable tab (FIFO strategy), but never remove dashboard
          let oldestIndex = -1
          for (let i = 0; i < state.tabs.length; i++) {
            const t = state.tabs[i]
            if (t.closable && t.id !== DASHBOARD_ID) {
              oldestIndex = i
              break
            }
          }
          if (oldestIndex >= 0) {
            state.tabs.splice(oldestIndex, 1)
          }
        }

        // Create new tab with unique ID
        const id = `${tab.path}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        const newTab: Tab = {
          ...tab,
          label,
          id,
          closable: tab.closable !== false,
        }

        state.activeTabId = id

        // Efficient array construction - single pass
        const dashboard = state.tabs[0]?.id === DASHBOARD_ID ? state.tabs[0] : null
        const otherTabs = dashboard ? state.tabs.slice(1) : state.tabs

        // Add new tab at the beginning of other tabs, dashboard always first
        state.tabs = dashboard ? [dashboard, newTab, ...otherTabs] : [newTab, ...otherTabs]
      })

      if (navigate) {
        navigate(tab.path)
      }
    },

    closeTab: (tabId: string, navigate?: (path: string) => void) => {
      set((state) => {
        const tabToClose = state.tabs.find((t) => t.id === tabId)
        if (!tabToClose || !tabToClose.closable || tabToClose.id === DASHBOARD_ID) {
          return // Cannot close dashboard
        }

        // Efficient single-pass filter
        const newTabs: Tab[] = []
        let removedIndex = -1
        for (let i = 0; i < state.tabs.length; i++) {
          if (state.tabs[i].id !== tabId) {
            newTabs.push(state.tabs[i])
          } else {
            removedIndex = i
          }
        }

        if (newTabs.length === 0) {
          // If closing last tab, open dashboard
          const dashboard: Tab = {
            id: DASHBOARD_ID,
            label: "Dashboard",
            path: "/",
            closable: false,
          }
          state.tabs = [dashboard]
          state.activeTabId = DASHBOARD_ID
          if (navigate) {
            navigate("/")
          }
          return
        }

        state.tabs = newTabs

        // If closing active tab, switch to previous or first tab
        if (state.activeTabId === tabId && removedIndex >= 0) {
          const prevTabs = get().tabs // Get tabs before removal
          const newActiveTab =
            prevTabs[removedIndex - 1] || prevTabs[removedIndex + 1] || newTabs[0]
          if (newActiveTab) {
            state.activeTabId = newActiveTab.id
            if (navigate) {
              navigate(newActiveTab.path)
            }
          }
        }
      })
    },

    setActiveTab: (tabId: string, navigate?: (path: string) => void) => {
      set((state) => {
        const tab = state.tabs.find((t) => t.id === tabId)
        if (tab && tab.id !== state.activeTabId) {
          state.activeTabId = tabId
          if (navigate) {
            navigate(tab.path)
          }
        }
      })
    },

    closeAllTabs: (navigate?: (path: string) => void) => {
      set((state) => {
        const dashboard: Tab = {
          id: DASHBOARD_ID,
          label: "Dashboard",
          path: "/",
          closable: false,
        }
        state.tabs = [dashboard]
        state.activeTabId = DASHBOARD_ID
      })
      if (navigate) {
        navigate("/")
      }
    },

    reorderTabs: (draggedId: string, targetIndex: number) => {
      set((state) => {
        // Dashboard cannot be moved
        if (draggedId === DASHBOARD_ID) {
          return
        }

        // Efficient single-pass separation
        const dashboard = state.tabs[0]?.id === DASHBOARD_ID ? state.tabs[0] : null
        const otherTabs: Tab[] = []

        for (let i = dashboard ? 1 : 0; i < state.tabs.length; i++) {
          if (state.tabs[i].id !== DASHBOARD_ID) {
            otherTabs.push(state.tabs[i])
          }
        }

        // Reorder only the non-dashboard tabs
        const reordered = reorderTabsArray(otherTabs, draggedId, targetIndex, "")

        // Always put dashboard first
        state.tabs = dashboard ? [dashboard, ...reordered] : reordered
      })
    },
  }))
)

// Atomic selectors
export const useTabs = () => useTabStore((state) => state.tabs)
export const useActiveTabId = () => useTabStore((state) => state.activeTabId)
export const useOpenTab = () => useTabStore((state) => state.openTab)
export const useCloseTab = () => useTabStore((state) => state.closeTab)
export const useSetActiveTab = () => useTabStore((state) => state.setActiveTab)
export const useCloseAllTabs = () => useTabStore((state) => state.closeAllTabs)
export const useReorderTabs = () => useTabStore((state) => state.reorderTabs)
export const useGetTabById = () => useTabStore((state) => state.getTabById)
export const useGetTabByPath = () => useTabStore((state) => state.getTabByPath)
