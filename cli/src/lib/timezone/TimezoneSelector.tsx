/**
 * Timezone Selector
 * Admin component for timezone selection
 */

import { Box } from "@/components/ui/box"
import { useTimezoneStore } from "@/stores/timezoneStore"
import { getAllTimezones } from "./timezoneUtils"

export function TimezoneSelector() {
  const timezone = useTimezoneStore((state) => state.timezone)
  const setTimezone = useTimezoneStore((state) => state.setTimezone)
  const resetToSystemTimezone = useTimezoneStore((state) => state.resetToSystemTimezone)
  const isAutoDetected = useTimezoneStore((state) => state.autoDetected)
  const timezones = getAllTimezones()

  return (
    <Box>
      <label htmlFor="timezone" className="text-sm block mb-2">
        Timezone (Admin Setting)
      </label>
      <select
        id="timezone"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        className="w-full px-3 py-2 border rounded-md"
        aria-label="Select timezone"
      >
        {timezones.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
      {isAutoDetected && (
        <p className="text-xs text-muted-foreground mt-1">
          Currently using system timezone. Select a timezone to override.
        </p>
      )}
      {!isAutoDetected && (
        <button
          onClick={resetToSystemTimezone}
          className="text-xs text-primary mt-1 hover:underline"
        >
          Reset to system timezone
        </button>
      )}
    </Box>
  )
}
