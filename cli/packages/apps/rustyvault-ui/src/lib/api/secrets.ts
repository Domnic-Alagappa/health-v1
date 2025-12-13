import { apiClient } from './client';
import { VAULT_ROUTES } from './routes';

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
  read: async (path: string): Promise<SecretResponse> => {
    const response = await apiClient.get<{ data: SecretData }>(VAULT_ROUTES.SECRETS.READ(path));
    return {
      data: response.data || {},
      metadata: {
        created_time: new Date().toISOString(),
        current_version: 1,
        max_versions: 0,
        oldest_version: 1,
        updated_time: new Date().toISOString(),
        versions: {},
      },
    };
  },

  write: async (path: string, data: SecretData): Promise<void> => {
    await apiClient.post(VAULT_ROUTES.SECRETS.WRITE(path), data);
  },

  list: async (path: string = ''): Promise<string[]> => {
    try {
      const response = await apiClient.get<SecretListResponse>(VAULT_ROUTES.SECRETS.LIST(path));
      return response.keys || [];
    } catch (error) {
      // If list fails, return empty array
      return [];
    }
  },

  delete: async (path: string): Promise<void> => {
    await apiClient.delete(VAULT_ROUTES.SECRETS.DELETE(path));
  },
};

