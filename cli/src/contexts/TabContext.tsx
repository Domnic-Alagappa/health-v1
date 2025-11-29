import { useNavigate } from "@tanstack/react-router"
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react"
import { reorderTabsArray } from "@/lib/dragUtils"

export interface Tab {
  id: string
  label: string
  path: string
  icon?: ReactNode
  closable?: boolean
  allowDuplicate?: boolean // If true, allows multiple tabs with same path (for forms, etc.)
}

interface TabContextType {
  tabs: Tab[]
  activeTabId: string | null
  openTab: (tab: Omit<Tab, "id">) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  closeAllTabs: () => void
  reorderTabs: (draggedId: string, targetIndex: number) => void
}

const TabContext = createContext<TabContextType | undefined>(undefined)

// Maximum number of tabs to prevent memory issues
const MAX_TABS = 50
const DASHBOARD_ID = "dashboard"

/**
 * Optimized TabProvider with efficient algorithms and memory management
 * - Uses Map for O(1) lookups instead of O(n) array.find()
 * - Efficient tab reordering with minimal array operations
 * - Memory-conscious tab management with automatic cleanup
 */
export function TabProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  const [tabs, setTabs] = useState<Tab[]>([
    {
      id: DASHBOARD_ID,
      label: "Dashboard",
      path: "/",
      closable: false,
    },
  ])
  const [activeTabId, setActiveTabId] = useState<string>(DASHBOARD_ID)

  // Use ref to track navigation to avoid stale closures and improve performance
  const navigateRef = useRef(navigate)
  navigateRef.current = navigate

  // Create Map index for O(1) lookups (updated on each render via useMemo)
  const tabsMap = useMemo(() => {
    const map = new Map<string, Tab>()
    tabs.forEach((tab) => {
      map.set(tab.id, tab)
      map.set(tab.path, tab) // Also index by path for quick path lookups
    })
    return map
  }, [tabs])

  const openTab = useCallback((tab: Omit<Tab, "id">) => {
    setTabs((prev) => {
      // If duplicates are not allowed (default), check if tab with same path exists
      // If it exists, just switch to it instead of creating a duplicate
      if (!tab.allowDuplicate) {
        const existing = prev.find((t) => t.path === tab.path && t.id !== DASHBOARD_ID)
        if (existing) {
          // Tab exists and duplicates not allowed - switch to existing tab
          setActiveTabId(existing.id)
          navigateRef.current({ to: tab.path as any })
          return prev
        }
      }

      // If duplicates are allowed, count existing tabs with same path for numbering
      let label = tab.label
      if (tab.allowDuplicate) {
        const tabsWithSamePath = prev.filter((t) => t.path === tab.path && t.id !== DASHBOARD_ID)
        const duplicateCount = tabsWithSamePath.length
        if (duplicateCount > 0) {
          label = `${tab.label} (${duplicateCount})`
        }
      }

      // Limit max tabs for performance - auto-close oldest tabs
      if (prev.length >= MAX_TABS) {
        // Remove oldest closable tab (FIFO strategy), but never remove dashboard
        // Use single pass filter for efficiency
        let oldestIndex = -1
        for (let i = 0; i < prev.length; i++) {
          const t = prev[i]
          if (t.closable && t.id !== DASHBOARD_ID) {
            oldestIndex = i
            break
          }
        }
        if (oldestIndex >= 0) {
          // Use efficient array manipulation
          const newTabs = new Array(prev.length - 1)
          for (let i = 0, j = 0; i < prev.length; i++) {
            if (i !== oldestIndex) {
              newTabs[j++] = prev[i]
            }
          }
          prev = newTabs
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

      setActiveTabId(id)
      navigateRef.current({ to: tab.path as any })

      // Efficient array construction - single pass
      const dashboard = prev[0]?.id === DASHBOARD_ID ? prev[0] : null
      const otherTabs = dashboard ? prev.slice(1) : prev

      // Add new tab at the beginning of other tabs, dashboard always first
      return dashboard ? [dashboard, newTab, ...otherTabs] : [newTab, ...otherTabs]
    })
  }, [])

  const closeTab = useCallback(
    (tabId: string) => {
      setTabs((prev) => {
        // O(1) lookup
        const tabToClose = tabsMap.get(tabId)
        if (!tabToClose || !tabToClose.closable || tabToClose.id === DASHBOARD_ID) {
          return prev // Cannot close dashboard
        }

        // Efficient single-pass filter
        const newTabs: Tab[] = []
        let removedIndex = -1
        for (let i = 0; i < prev.length; i++) {
          if (prev[i].id !== tabId) {
            newTabs.push(prev[i])
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
          setActiveTabId(DASHBOARD_ID)
          navigateRef.current({ to: "/" })
          return [dashboard]
        }

        // If closing active tab, switch to previous or first tab
        if (activeTabId === tabId && removedIndex >= 0) {
          const newActiveTab = prev[removedIndex - 1] || prev[removedIndex + 1] || newTabs[0]
          setActiveTabId(newActiveTab.id)
          navigateRef.current({ to: newActiveTab.path as any })
        }

        return newTabs
      })
    },
    [activeTabId, tabsMap]
  )

  const setActiveTab = useCallback(
    (tabId: string) => {
      // O(1) lookup
      const tab = tabsMap.get(tabId)
      if (tab && tab.id !== activeTabId) {
        setActiveTabId(tabId)
        navigateRef.current({ to: tab.path as any })
      }
    },
    [activeTabId, tabsMap]
  )

  const closeAllTabs = useCallback(() => {
    const dashboard: Tab = {
      id: DASHBOARD_ID,
      label: "Dashboard",
      path: "/",
      closable: false,
    }
    setTabs([dashboard])
    setActiveTabId(DASHBOARD_ID)
    navigateRef.current({ to: "/" })
  }, [])

  const reorderTabs = useCallback((draggedId: string, targetIndex: number) => {
    setTabs((prev) => {
      // Dashboard cannot be moved
      if (draggedId === DASHBOARD_ID) {
        return prev
      }

      // Efficient single-pass separation
      const dashboard = prev[0]?.id === DASHBOARD_ID ? prev[0] : null
      const otherTabs: Tab[] = []

      for (let i = dashboard ? 1 : 0; i < prev.length; i++) {
        if (prev[i].id !== DASHBOARD_ID) {
          otherTabs.push(prev[i])
        }
      }

      // Reorder only the non-dashboard tabs
      const reordered = reorderTabsArray(otherTabs, draggedId, targetIndex, "")

      // Always put dashboard first
      return dashboard ? [dashboard, ...reordered] : reordered
    })
  }, [])

  // Memoize context value to prevent unnecessary re-renders of all consumers
  const contextValue = useMemo(
    () => ({
      tabs,
      activeTabId,
      openTab,
      closeTab,
      setActiveTab,
      closeAllTabs,
      reorderTabs,
    }),
    [tabs, activeTabId, openTab, closeTab, setActiveTab, closeAllTabs, reorderTabs]
  )

  return <TabContext.Provider value={contextValue}>{children}</TabContext.Provider>
}

export function useTabs() {
  const context = useContext(TabContext)
  if (context === undefined) {
    throw new Error("useTabs must be used within a TabProvider")
  }
  return context
}
