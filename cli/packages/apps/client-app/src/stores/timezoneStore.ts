/**
 * Timezone Store
 * Admin-level timezone management
 * All timestamps displayed in admin-selected timezone
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface TimezoneState {
  timezone: string; // IANA timezone identifier (e.g., 'America/New_York')
  autoDetected: boolean; // Whether timezone was auto-detected
}

interface TimezoneActions {
  setTimezone: (timezone: string) => void;
  resetToSystemTimezone: () => void;
}

type TimezoneStore = TimezoneState & TimezoneActions;

// Auto-detect system timezone
const getSystemTimezone = (): string => {
  if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
  // Fallback to UTC if Intl API not available
  return "UTC";
};

const initialState: TimezoneState = {
  timezone: getSystemTimezone(),
  autoDetected: true,
};

export const useTimezoneStore = create<TimezoneStore>()(
  persist(
    (set) => ({
      ...initialState,

      setTimezone: (timezone: string) => {
        set({
          timezone,
          autoDetected: false,
        });
      },

      resetToSystemTimezone: () => {
        set({
          timezone: getSystemTimezone(),
          autoDetected: true,
        });
      },
    }),
    {
      name: "timezone-storage",
      partialize: (state) => ({
        timezone: state.timezone,
        autoDetected: state.autoDetected,
      }),
    }
  )
);

// Atomic selectors
export const useTimezone = () => useTimezoneStore((state) => state.timezone);
export const useSetTimezone = () => useTimezoneStore((state) => state.setTimezone);
export const useResetToSystemTimezone = () =>
  useTimezoneStore((state) => state.resetToSystemTimezone);
export const useIsAutoDetectedTimezone = () => useTimezoneStore((state) => state.autoDetected);
