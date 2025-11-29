/**
 * OIDC Configuration
 * OpenID Connect configuration constants
 */

export const OIDC_CONFIG = {
  ISSUER: import.meta.env.VITE_OIDC_ISSUER || 'http://localhost:8080',
  CLIENT_ID: import.meta.env.VITE_OIDC_CLIENT_ID || 'default-client',
  CLIENT_SECRET: import.meta.env.VITE_OIDC_CLIENT_SECRET || '', // Server-side only, not used in frontend
  REDIRECT_URI: import.meta.env.VITE_OIDC_REDIRECT_URI || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'),
  SCOPES: ['openid', 'profile', 'email', 'offline_access'] as const,
  RESPONSE_TYPE: 'code' as const,
  TOKEN_ENDPOINT: '/auth/token',
  USERINFO_ENDPOINT: '/auth/userinfo',
  DISCOVERY_ENDPOINT: '/.well-known/openid-configuration',
} as const;

export type OidcScope = (typeof OIDC_CONFIG.SCOPES)[number];

