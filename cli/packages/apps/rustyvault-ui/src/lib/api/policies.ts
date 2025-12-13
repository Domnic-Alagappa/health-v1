import { apiClient } from './client';
import { VAULT_ROUTES } from './routes';

export interface Policy {
  name: string;
  policy: string;
  type?: string;
}

export interface PolicyListResponse {
  keys: string[];
}

export interface CapabilitiesRequest {
  path: string;
  policies?: string[];
}

export interface CapabilitiesResponse {
  capabilities: string[];
  path: string;
}

export const policiesApi = {
  /**
   * List all ACL policies
   */
  list: async (): Promise<PolicyListResponse> => {
    return apiClient.get<PolicyListResponse>(VAULT_ROUTES.POLICIES.LIST);
  },

  /**
   * Read a specific policy
   */
  read: async (name: string): Promise<Policy> => {
    return apiClient.get<Policy>(VAULT_ROUTES.POLICIES.GET(name));
  },

  /**
   * Create or update a policy
   */
  write: async (name: string, policy: string): Promise<void> => {
    await apiClient.post(VAULT_ROUTES.POLICIES.CREATE(name), { policy });
  },

  /**
   * Delete a policy
   */
  delete: async (name: string): Promise<void> => {
    await apiClient.delete(VAULT_ROUTES.POLICIES.DELETE(name));
  },

  /**
   * Check capabilities for a path
   */
  checkCapabilities: async (path: string, policies?: string[]): Promise<CapabilitiesResponse> => {
    return apiClient.post<CapabilitiesResponse>(VAULT_ROUTES.POLICIES.CAPABILITIES, { path, policies });
  },
};

