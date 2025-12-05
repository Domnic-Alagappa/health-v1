/**
 * API Client Configuration
 * Re-export from shared package with admin-specific overrides if needed
 */

import { API_ROUTES, API_CONFIG as SHARED_API_CONFIG, getApiUrl } from "@health-v1/shared/api";
import { env } from "../env";

// Use shared config but allow admin-specific env overrides
export const API_CONFIG = {
  ...SHARED_API_CONFIG,
  BASE_URL: env.VITE_API_BASE_URL || SHARED_API_CONFIG.BASE_URL,
} as const;

// Re-export routes and getApiUrl from shared
export { API_ROUTES, getApiUrl };

/**
 * API Client with fetch wrapper
 * Uses cookie-based authentication (sessions) for web UI
 */
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = getApiUrl(path);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

  // Build headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-App-Type": "admin-ui",
    "X-App-Device": "web",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
      // Include cookies in requests for session-based authentication
      credentials: "include",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: response.statusText,
        status: response.status,
      }));
      throw new Error(error.message || `API Error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}
