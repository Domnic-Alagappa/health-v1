/**
 * Environment Variable Validation
 * Validates and provides type-safe access to environment variables
 */

interface EnvConfig {
  VITE_API_BASE_URL: string;
  VITE_OIDC_ISSUER: string;
  VITE_OIDC_CLIENT_ID: string;
  VITE_OIDC_REDIRECT_URI?: string;
}

const requiredEnvVars: (keyof EnvConfig)[] = [
  "VITE_API_BASE_URL",
  "VITE_OIDC_ISSUER",
  "VITE_OIDC_CLIENT_ID",
];

/**
 * Validate environment variables
 */
export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of requiredEnvVars) {
    if (!import.meta.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        "Using default values. This may cause issues in production."
    );
  }
}

/**
 * Get environment configuration with defaults
 */
export function getEnvConfig(): EnvConfig {
  return {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
    VITE_OIDC_ISSUER: import.meta.env.VITE_OIDC_ISSUER || "http://localhost:8080",
    VITE_OIDC_CLIENT_ID: import.meta.env.VITE_OIDC_CLIENT_ID || "default-client",
    VITE_OIDC_REDIRECT_URI: import.meta.env.VITE_OIDC_REDIRECT_URI || window.location.origin,
  };
}

// Validate on module load (development only)
if (import.meta.env.DEV) {
  validateEnv();
}
