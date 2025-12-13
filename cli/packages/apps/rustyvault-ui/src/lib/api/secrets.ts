import { apiClient } from './client';

export interface SecretData {
  [key: string]: any;
}

export interface SecretVersion {
  created_time: string;
  deletion_time?: string;
  destroyed: boolean;
  version: number;
}

export interface SecretMetadata {
  created_time: string;
  current_version: number;
  max_versions: number;
  oldest_version: number;
  updated_time: string;
  versions: { [version: string]: SecretVersion };
}

export interface SecretResponse {
  data: SecretData;
  metadata: SecretMetadata;
}

export interface SecretListResponse {
  keys: string[];
}

export const secretsApi = {
  read: async (mountPath: string, path: string, version?: number): Promise<SecretResponse> => {
    const url = `/${mountPath}/data/${path}`;
    const params = version ? { version: version.toString() } : undefined;
    return apiClient.get<SecretResponse>(url, { params });
  },

  write: async (mountPath: string, path: string, data: SecretData): Promise<void> => {
    const url = `/${mountPath}/data/${path}`;
    await apiClient.post(url, { data });
  },

  list: async (mountPath: string, path: string = ''): Promise<string[]> => {
    const url = `/${mountPath}/data/${path}`.replace(/\/+$/, '') || `/${mountPath}/data`;
    const response = await apiClient.list<SecretListResponse>(url);
    return response.keys || [];
  },

  getMetadata: async (mountPath: string, path: string): Promise<SecretMetadata> => {
    const url = `/${mountPath}/metadata/${path}`;
    return apiClient.get<SecretMetadata>(url);
  },

  delete: async (mountPath: string, path: string, versions: number[]): Promise<void> => {
    const url = `/${mountPath}/delete/${path}`;
    await apiClient.post(url, { versions });
  },

  destroy: async (mountPath: string, path: string, versions: number[]): Promise<void> => {
    const url = `/${mountPath}/destroy/${path}`;
    await apiClient.post(url, { versions });
  },
};

