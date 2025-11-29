/**
 * Timezone Utilities
 * Timezone conversion and formatting utilities
 */

import { useTimezoneStore } from "@/stores/timezoneStore"

export function formatDateInTimezone(
  date: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const timezone = useTimezoneStore.getState().timezone
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date

  return new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    ...options,
  }).format(dateObj)
}

export function convertToTimezone(date: Date | string | number, targetTimezone: string): Date {
  const dateObj = typeof date === "string" || typeof date === "number" ? new Date(date) : date

  // Get date string in target timezone
  const dateString = new Intl.DateTimeFormat("en-US", {
    timeZone: targetTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(dateObj)

  // Parse back to Date object
  return new Date(dateString)
}

export function getCurrentTimeInTimezone(timezone?: string): Date {
  const tz = timezone || useTimezoneStore.getState().timezone
  return convertToTimezone(new Date(), tz)
}

export function getAllTimezones(): Array<{ value: string; label: string }> {
  // Common timezones - in a real app, you might want a more comprehensive list
  return [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "America/Phoenix", label: "Arizona Time" },
    { value: "America/Anchorage", label: "Alaska Time" },
    { value: "Pacific/Honolulu", label: "Hawaii Time" },
    { value: "UTC", label: "UTC" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Asia/Dubai", label: "Dubai (GST)" },
    { value: "Australia/Sydney", label: "Sydney (AEST)" },
  ]
}
