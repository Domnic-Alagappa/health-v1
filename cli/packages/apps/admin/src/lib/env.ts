/**
 * Environment Configuration
 * Validates and provides access to environment variables
 */

interface EnvConfig {
  VITE_API_BASE_URL: string
  VITE_OIDC_ISSUER?: string
  VITE_OIDC_CLIENT_ID?: string
  VITE_ENABLE_MFA?: string
  VITE_ENABLE_PASSKEYS?: string
  VITE_ENABLE_SSO?: string
  VITE_ENABLE_POSTGRES?: string
  VITE_ENABLE_OPENBAO_SERVICE?: string
  VITE_ENABLE_LOCALSTACK?: string
  VITE_ENABLE_NATS?: string
  VITE_ENABLE_KAFKA?: string
}

const requiredEnvVars = ["VITE_API_BASE_URL"] as const
const optionalEnvVars = [
  "VITE_OIDC_ISSUER",
  "VITE_OIDC_CLIENT_ID",
  "VITE_ENABLE_MFA",
  "VITE_ENABLE_PASSKEYS",
  "VITE_ENABLE_SSO",
  "VITE_ENABLE_POSTGRES",
  "VITE_ENABLE_OPENBAO_SERVICE",
  "VITE_ENABLE_LOCALSTACK",
  "VITE_ENABLE_NATS",
  "VITE_ENABLE_KAFKA",
] as const

function getEnvVar(key: string): string | undefined {
  if (typeof window !== "undefined") {
    return import.meta.env[key]
  }
  return process.env[key]
}

function validateEnv(): EnvConfig {
  const missing: string[] = []
  const config: Partial<EnvConfig> = {}

  // Check required variables - provide defaults for development
  for (const key of requiredEnvVars) {
    let value = getEnvVar(key)
    
    // Provide default for VITE_API_BASE_URL in development
    if (!value && key === "VITE_API_BASE_URL" && import.meta.env.DEV) {
      value = "http://localhost:8080"
      console.warn(`Using default ${key}=${value} for development`)
    }
    
    if (!value) {
      missing.push(key)
    } else {
      config[key] = value
    }
  }

  // Check optional variables
  for (const key of optionalEnvVars) {
    const value = getEnvVar(key)
    if (value) {
      config[key] = value
    }
  }

  if (missing.length > 0) {
    const errorMessage = `Missing required environment variables: ${missing.join(", ")}\n\n` +
      `Please set these in your .env file or environment.\n` +
      `See .env.example for reference.`
    
    if (import.meta.env.DEV) {
      console.error(errorMessage)
      // In development, provide defaults if possible
      if (missing.includes("VITE_API_BASE_URL")) {
        config.VITE_API_BASE_URL = "http://localhost:8080"
        console.warn("Using default VITE_API_BASE_URL=http://localhost:8080 for development")
        return config as EnvConfig
      }
      throw new Error(errorMessage)
    } else {
      // In production, fail silently but log
      console.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  return config as EnvConfig
}

// Validate on module load
let envConfig: EnvConfig
try {
  envConfig = validateEnv()
} catch (error) {
  // Final fallback - provide minimal defaults for development
  if (import.meta.env.DEV) {
    envConfig = {
      VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8080",
    }
    console.warn("Using default environment configuration for development")
  } else {
    throw error
  }
}

export const env = envConfig

// Helper functions
export const isDevelopment = import.meta.env.DEV
export const isProduction = import.meta.env.PROD
export const isMFAEnabled = env.VITE_ENABLE_MFA === "true"
export const isPasskeysEnabled = env.VITE_ENABLE_PASSKEYS === "true"
export const isSSOEnabled = env.VITE_ENABLE_SSO === "true"

// Service enable flags
export const isPostgresEnabled = env.VITE_ENABLE_POSTGRES !== "false"
export const isOpenBaoEnabled = env.VITE_ENABLE_OPENBAO_SERVICE !== "false"
export const isLocalStackEnabled = env.VITE_ENABLE_LOCALSTACK !== "false"
export const isNATSEnabled = env.VITE_ENABLE_NATS === "true"
export const isKafkaEnabled = env.VITE_ENABLE_KAFKA === "true"

// API configuration
export const API_BASE_URL = env.VITE_API_BASE_URL
export const OIDC_ISSUER = env.VITE_OIDC_ISSUER
export const OIDC_CLIENT_ID = env.VITE_OIDC_CLIENT_ID

