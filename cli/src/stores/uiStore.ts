/**
 * UI Store
 * Non-PHI UI state (sidebar, tabs, filters, etc.)
 * Safe to persist to localStorage
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  sidebarCollapsed: boolean;
  activeTabId: string | null;
  theme: 'light' | 'dark' | 'system';
  sidebarExpandedItems: Set<string>;
  disclosures: Record<string, boolean>; // For modals, dialogs, dropdowns, etc.
  preferences: {
    showMaskedFields: boolean;
    autoRefresh: boolean;
    refreshInterval: number;
  };
}

interface UIActions {
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveTabId: (tabId: string | null) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebarExpand: (path: string) => void;
  setSidebarExpandedItems: (items: Set<string>) => void;
  openDisclosure: (id: string) => void;
  closeDisclosure: (id: string) => void;
  toggleDisclosure: (id: string) => void;
  resetDisclosure: (id: string) => void;
  updatePreferences: (preferences: Partial<UIState['preferences']>) => void;
  resetPreferences: () => void;
}

type UIStore = UIState & UIActions;

const initialState: UIState = {
  sidebarCollapsed: false,
  activeTabId: null,
  theme: 'system',
  sidebarExpandedItems: new Set<string>(),
  disclosures: {},
  preferences: {
    showMaskedFields: true,
    autoRefresh: false,
    refreshInterval: 30000, // 30 seconds
  },
};

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      setActiveTabId: (tabId: string | null) => {
        set({ activeTabId: tabId });
      },

      setTheme: (theme: 'light' | 'dark' | 'system') => {
        set({ theme });
      },

      toggleSidebarExpand: (path: string) => {
        set((state) => {
          const next = new Set(state.sidebarExpandedItems);
          if (next.has(path)) {
            next.delete(path);
          } else {
            // Auto-collapse other items (Excel-style: only one section open at a time)
            next.clear();
            next.add(path);
          }
          return { sidebarExpandedItems: next };
        });
      },

      setSidebarExpandedItems: (items: Set<string>) => {
        set({ sidebarExpandedItems: items });
      },

      openDisclosure: (id: string) => {
        set((state) => ({
          disclosures: {
            ...state.disclosures,
            [id]: true,
          },
        }));
      },

      closeDisclosure: (id: string) => {
        set((state) => {
          const { [id]: _, ...rest } = state.disclosures;
          return { disclosures: rest };
        });
      },

      toggleDisclosure: (id: string) => {
        set((state) => ({
          disclosures: {
            ...state.disclosures,
            [id]: !state.disclosures[id],
          },
        }));
      },

      resetDisclosure: (id: string) => {
        set((state) => {
          const { [id]: _, ...rest } = state.disclosures;
          return { disclosures: rest };
        });
      },

      updatePreferences: (newPreferences: Partial<UIState['preferences']>) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
          },
        }));
      },

      resetPreferences: () => {
        set({ preferences: initialState.preferences });
      },
    }),
    {
      name: 'ui-storage', // localStorage key
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        // Don't persist sidebarExpandedItems (Set is complex to persist, will reset on reload)
        preferences: state.preferences,
        // Don't persist activeTabId or disclosures
      }),
    }
  )
);

// Selectors
export const useSidebarCollapsed = () => useUIStore((state) => state.sidebarCollapsed);
export const useSetSidebarCollapsed = () => useUIStore((state) => state.setSidebarCollapsed);
export const useTheme = () => useUIStore((state) => state.theme);
export const useSetTheme = () => useUIStore((state) => state.setTheme);
export const useSidebarExpandedItems = () => useUIStore((state) => state.sidebarExpandedItems);
export const useToggleSidebarExpand = () => useUIStore((state) => state.toggleSidebarExpand);
export const useUIPreferences = () => useUIStore((state) => state.preferences);
export const useUpdatePreferences = () => useUIStore((state) => state.updatePreferences);

