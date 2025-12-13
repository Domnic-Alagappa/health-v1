import { apiClient } from './client';
import { VAULT_ROUTES } from './routes';

export interface SealStatus {
  sealed: boolean;
  t: number;
  n: number;
  progress: number;
  version?: string;
  migration?: boolean;
  recovery_seal?: boolean;
  storage_type?: string;
}

export interface Mount {
  type: string;
  description?: string;
  config?: {
    default_lease_ttl?: number;
    max_lease_ttl?: number;
    force_no_cache?: boolean;
  };
  options?: Record<string, string>;
  local?: boolean;
  seal_wrap?: boolean;
  external_entropy_access?: boolean;
}

export interface MountsResponse {
  [path: string]: Mount;
}

export interface AuthMethod {
  type: string;
  description?: string;
  config?: {
    default_lease_ttl?: number;
    max_lease_ttl?: number;
    force_no_cache?: boolean;
  };
  options?: Record<string, string>;
  local?: boolean;
  seal_wrap?: boolean;
  external_entropy_access?: boolean;
}

export interface AuthMethodsResponse {
  [path: string]: AuthMethod;
}

export interface UnsealRequest {
  key: string;
  reset?: boolean;
}

export interface UnsealResponse {
  sealed: boolean;
  t: number;
  n: number;
  progress: number;
}

export interface InitRequest {
  secret_shares?: number;
  secret_threshold?: number;
}

export interface InitResponse {
  keys: string[];
  keys_base64: string[];
  root_token: string;
  warning?: string;
}

export const systemApi = {
  getSealStatus: async (): Promise<SealStatus> => {
    return apiClient.get<SealStatus>(VAULT_ROUTES.SYS.SEAL_STATUS);
  },

  unseal: async (key: string, reset: boolean = false): Promise<UnsealResponse> => {
    return apiClient.post<UnsealResponse>(VAULT_ROUTES.SYS.UNSEAL, { key, reset });
  },

  seal: async (): Promise<void> => {
    await apiClient.post(VAULT_ROUTES.SYS.SEAL);
  },

  listMounts: async (): Promise<MountsResponse> => {
    return apiClient.get<MountsResponse>(VAULT_ROUTES.SYS.MOUNTS);
  },

  enableMount: async (path: string, mount: Partial<Mount>): Promise<void> => {
    await apiClient.post(VAULT_ROUTES.SYS.MOUNT(path), mount);
  },

  disableMount: async (path: string): Promise<void> => {
    await apiClient.delete(VAULT_ROUTES.SYS.MOUNT(path));
  },

  listAuthMethods: async (): Promise<AuthMethodsResponse> => {
    return apiClient.get<AuthMethodsResponse>(VAULT_ROUTES.SYS.AUTH);
  },

  enableAuthMethod: async (path: string, authMethod: Partial<AuthMethod>): Promise<void> => {
    await apiClient.post(VAULT_ROUTES.SYS.AUTH_METHOD(path), authMethod);
  },

  disableAuthMethod: async (path: string): Promise<void> => {
    await apiClient.delete(VAULT_ROUTES.SYS.AUTH_METHOD(path));
  },

  init: async (request: InitRequest): Promise<InitResponse> => {
    return apiClient.post<InitResponse>(VAULT_ROUTES.SYS.INIT, request);
  },

  getHealth: async (): Promise<SealStatus> => {
    return apiClient.get<SealStatus>(VAULT_ROUTES.SYS.HEALTH);
  },
};

