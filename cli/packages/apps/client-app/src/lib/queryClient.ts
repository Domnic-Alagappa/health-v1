/**
 * TanStack Query Client Setup
 * Configured for healthcare security requirements
 */

import { QueryClient } from "@tanstack/react-query"
import { SECURITY_CONFIG } from "@health-v1/shared/constants/security"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds - balance between freshness and performance
      gcTime: 5 * 60 * 1000, // 5 minutes - garbage collection time (formerly cacheTime)
      retry: 1, // Retry once on failure
      refetchOnWindowFocus: false, // Don't refetch on window focus for security
      refetchOnReconnect: true, // Refetch on reconnect
      refetchOnMount: true, // Refetch on mount for fresh data
    },
    mutations: {
      retry: 1,
    },
  },
})

/**
 * Clear all sensitive data from cache
 * Called on logout
 */
export function clearSensitiveCache() {
  queryClient.clear()
}

/**
 * Invalidate all patient-related queries
 */
export function invalidatePatientQueries() {
  queryClient.invalidateQueries({ queryKey: ["patients"] })
}
