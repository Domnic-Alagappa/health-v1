import { apiClient } from './client';

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
    return apiClient.get<PolicyListResponse>('/sys/policies/acl');
  },

  /**
   * Read a specific policy
   */
  read: async (name: string): Promise<Policy> => {
    return apiClient.get<Policy>(`/sys/policies/acl/${name}`);
  },

  /**
   * Create or update a policy
   */
  write: async (name: string, policy: string): Promise<void> => {
    await apiClient.post(`/sys/policies/acl/${name}`, { policy });
  },

  /**
   * Delete a policy
   */
  delete: async (name: string): Promise<void> => {
    await apiClient.delete(`/sys/policies/acl/${name}`);
  },

  /**
   * Check capabilities for a path
   */
  checkCapabilities: async (path: string, policies?: string[]): Promise<CapabilitiesResponse> => {
    return apiClient.post<CapabilitiesResponse>('/sys/capabilities', { path, policies });
  },
};

