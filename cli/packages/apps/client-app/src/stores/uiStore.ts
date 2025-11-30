/**
 * UI Store
 * Non-PHI UI state (sidebar, tabs, filters, etc.)
 * Safe to persist to localStorage
 */

import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { UIState, UIActions, UIStore } from "@health-v1/shared/types/stores/ui"

// Re-export types
export type { UIState, UIActions, UIStore }

const initialState: UIState = {
  sidebarCollapsed: false,
  activeTabId: null,
  sidebarExpandedItems: new Set<string>(),
  disclosures: {},
  preferences: {
    showMaskedFields: true,
    autoRefresh: false,
    refreshInterval: 30000, // 30 seconds
  },
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed })
      },

      setActiveTabId: (tabId: string | null) => {
        set({ activeTabId: tabId })
      },

      toggleSidebarExpand: (path: string) => {
        set((state) => {
          const next = new Set(state.sidebarExpandedItems)
          if (next.has(path)) {
            next.delete(path)
          } else {
            // Auto-collapse other items (Excel-style: only one section open at a time)
            next.clear()
            next.add(path)
          }
          return { sidebarExpandedItems: next }
        })
      },

      setSidebarExpandedItems: (items: Set<string>) => {
        set({ sidebarExpandedItems: items })
      },

      openDisclosure: (id: string) => {
        set((state) => ({
          disclosures: {
            ...state.disclosures,
            [id]: true,
          },
        }))
      },

      closeDisclosure: (id: string) => {
        set((state) => {
          const { [id]: _, ...rest } = state.disclosures
          return { disclosures: rest }
        })
      },

      toggleDisclosure: (id: string) => {
        set((state) => ({
          disclosures: {
            ...state.disclosures,
            [id]: !state.disclosures[id],
          },
        }))
      },

      resetDisclosure: (id: string) => {
        set((state) => {
          const { [id]: _, ...rest } = state.disclosures
          return { disclosures: rest }
        })
      },

      updatePreferences: (newPreferences: Partial<UIState["preferences"]>) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
          },
        }))
      },

      resetPreferences: () => {
        set({ preferences: initialState.preferences })
      },
    }),
    {
      name: "ui-storage", // localStorage key
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        // Don't persist sidebarExpandedItems (Set is complex to persist, will reset on reload)
        preferences: state.preferences,
        // Don't persist activeTabId or disclosures
      }),
    }
  )
)

// Selectors
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed)
export const useSetSidebarCollapsed = () => useUIStore((state) => state.setSidebarCollapsed)
export const useSidebarExpandedItems = () => useUIStore((state) => state.sidebarExpandedItems)
export const useToggleSidebarExpand = () => useUIStore((state) => state.toggleSidebarExpand)
export const useUIPreferences = () => useUIStore((state) => state.preferences)
export const useUpdatePreferences = () => useUIStore((state) => state.updatePreferences)
