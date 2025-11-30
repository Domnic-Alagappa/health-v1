/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_OIDC_ISSUER?: string;
  readonly VITE_OIDC_CLIENT_ID?: string;
  readonly VITE_OIDC_CLIENT_SECRET?: string;
  readonly VITE_OIDC_REDIRECT_URI?: string;
  readonly VITE_API_TIMEOUT?: string;
  readonly VITE_API_RETRY_ATTEMPTS?: string;
  readonly VITE_API_RETRY_DELAY?: string;
  readonly VITE_ENABLE_MFA?: string;
  readonly VITE_ENABLE_PASSKEYS?: string;
  readonly VITE_ENABLE_SSO?: string;
  readonly VITE_ENABLE_POSTGRES?: string;
  readonly VITE_ENABLE_OPENBAO_SERVICE?: string;
  readonly VITE_ENABLE_LOCALSTACK?: string;
  readonly VITE_ENABLE_NATS?: string;
  readonly VITE_ENABLE_KAFKA?: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
