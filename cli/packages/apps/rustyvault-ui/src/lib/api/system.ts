import { apiClient } from './client';

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

export const systemApi = {
  getSealStatus: async (): Promise<SealStatus> => {
    return apiClient.get<SealStatus>('/sys/seal-status');
  },

  unseal: async (key: string, reset: boolean = false): Promise<UnsealResponse> => {
    return apiClient.put<UnsealResponse>('/sys/unseal', { key, reset });
  },

  seal: async (): Promise<void> => {
    await apiClient.post('/sys/seal');
  },

  listMounts: async (): Promise<MountsResponse> => {
    return apiClient.get<MountsResponse>('/sys/mounts');
  },

  enableMount: async (path: string, mount: Partial<Mount>): Promise<void> => {
    await apiClient.post(`/sys/mounts/${path}`, mount);
  },

  disableMount: async (path: string): Promise<void> => {
    await apiClient.delete(`/sys/mounts/${path}`);
  },

  listAuthMethods: async (): Promise<AuthMethodsResponse> => {
    return apiClient.get<AuthMethodsResponse>('/sys/auth');
  },

  enableAuthMethod: async (path: string, authMethod: Partial<AuthMethod>): Promise<void> => {
    await apiClient.post(`/sys/auth/${path}`, authMethod);
  },

  disableAuthMethod: async (path: string): Promise<void> => {
    await apiClient.delete(`/sys/auth/${path}`);
  },
};

