/**
 * API Configuration Constants
 * Unified API configuration used across all applications
 */

export const API_CONFIG = {
  BASE_URL:
    typeof window !== "undefined"
      ? import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
      : "http://localhost:8080",
  API_PREFIX: import.meta.env?.VITE_API_PREFIX || "/api",
  TIMEOUT: Number(import.meta.env?.VITE_API_TIMEOUT) || 30000, // 30 seconds
  RETRY_ATTEMPTS: Number(import.meta.env?.VITE_API_RETRY_ATTEMPTS) || 3,
  RETRY_DELAY: Number(import.meta.env?.VITE_API_RETRY_DELAY) || 1000, // 1 second
} as const;

/**
 * Paths that should NOT have the API prefix automatically added
 * These are typically system-level endpoints or routes that don't use the /api prefix on backend
 */
const EXCLUDED_PATHS = ["/health", "/auth"];

/**
 * Check if a path should have the API prefix added
 */
function shouldAddApiPrefix(path: string): boolean {
  // If path already starts with /api, don't add it again
  if (path.startsWith("/api")) {
    return false;
  }
  
  // If path is in excluded list, don't add prefix
  if (EXCLUDED_PATHS.some(excluded => path === excluded || path.startsWith(`${excluded}/`))) {
    return false;
  }
  
  return true;
}

/**
 * Create full API URL with automatic prefix handling
 */
export function getApiUrl(path: string): string {
  const baseUrl = API_CONFIG.BASE_URL.replace(/\/$/, "");
  let apiPath = path.startsWith("/") ? path : `/${path}`;
  
  // Automatically add API prefix if needed
  if (shouldAddApiPrefix(apiPath)) {
    const prefix = API_CONFIG.API_PREFIX.replace(/\/$/, "");
    apiPath = `${prefix}${apiPath}`;
  }
  
  return `${baseUrl}${apiPath}`;
}
