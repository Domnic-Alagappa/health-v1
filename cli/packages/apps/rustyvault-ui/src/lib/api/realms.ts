import { apiClient } from './client';
import { VAULT_ROUTES } from './routes';

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
    const response = await apiClient.get<RealmListResponse>(VAULT_ROUTES.REALMS.LIST);
    return response.keys || [];
  },

  get: async (realmId: string): Promise<Realm> => {
    return apiClient.get<Realm>(VAULT_ROUTES.REALMS.GET(realmId));
  },

  create: async (realm: Realm): Promise<void> => {
    await apiClient.post(VAULT_ROUTES.REALMS.CREATE(realm.id), realm);
  },

  update: async (realmId: string, realm: Partial<Realm>): Promise<void> => {
    await apiClient.put(VAULT_ROUTES.REALMS.UPDATE(realmId), { ...realm, id: realmId });
  },

  delete: async (realmId: string): Promise<void> => {
    await apiClient.delete(VAULT_ROUTES.REALMS.DELETE(realmId));
  },
};

