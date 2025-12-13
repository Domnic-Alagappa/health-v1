import { apiClient } from './client';

export interface Realm {
  id: string;
  name: string;
  enabled: boolean;
  config?: Record<string, any>;
  metadata?: Record<string, string>;
}

export interface RealmListResponse {
  keys: string[];
}

export const realmsApi = {
  list: async (): Promise<string[]> => {
    const response = await apiClient.get<RealmListResponse>('/sys/realm');
    return response.keys || [];
  },

  get: async (realmId: string): Promise<Realm> => {
    return apiClient.get<Realm>(`/sys/realm/${realmId}`);
  },

  create: async (realm: Realm): Promise<void> => {
    await apiClient.post(`/sys/realm/${realm.id}`, realm);
  },

  update: async (realmId: string, realm: Partial<Realm>): Promise<void> => {
    await apiClient.put(`/sys/realm/${realmId}`, { ...realm, id: realmId });
  },

  delete: async (realmId: string): Promise<void> => {
    await apiClient.delete(`/sys/realm/${realmId}`);
  },
};

