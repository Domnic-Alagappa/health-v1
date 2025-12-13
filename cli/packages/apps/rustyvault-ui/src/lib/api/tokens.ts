import { apiClient } from './client';
import { VAULT_ROUTES } from './routes';

export interface TokenInfo {
  id: string;
  display_name?: string;
  policies: string[];
  ttl?: number;
  expires_at?: string;
  created_at?: string;
  last_used_at?: string;
  renewable?: boolean;
  path?: string;
}

export interface CreateTokenRequest {
  display_name?: string;
  policies?: string[];
  ttl?: number;
  renewable?: boolean;
  num_uses?: number;
  meta?: Record<string, any>;
}

export interface CreateTokenResponse {
  auth: {
    client_token: string;
    accessor: string;
    policies: string[];
    token_ttl: number;
    renewable: boolean;
    expires_at?: string;
  };
}

export interface RenewTokenResponse {
  auth: {
    client_token: string;
    policies: string[];
    token_ttl: number;
    renewable: boolean;
    expires_at?: string;
  };
}

export const tokensApi = {
  /**
   * Create a new token
   */
  create: async (request: CreateTokenRequest): Promise<CreateTokenResponse> => {
    return apiClient.post<CreateTokenResponse>(VAULT_ROUTES.AUTH.TOKEN_CREATE, request);
  },

  /**
   * Lookup a token
   */
  lookup: async (token: string): Promise<{ data: TokenInfo }> => {
    return apiClient.post<{ data: TokenInfo }>(VAULT_ROUTES.AUTH.TOKEN_LOOKUP, { token });
  },

  /**
   * Lookup the current token (self)
   */
  lookupSelf: async (): Promise<{ data: TokenInfo }> => {
    return apiClient.get<{ data: TokenInfo }>(VAULT_ROUTES.AUTH.TOKEN_LOOKUP_SELF);
  },

  /**
   * Renew a token
   */
  renew: async (token: string, increment?: number): Promise<RenewTokenResponse> => {
    return apiClient.post<RenewTokenResponse>(VAULT_ROUTES.AUTH.TOKEN_RENEW, { token, increment });
  },

  /**
   * Renew the current token (self)
   */
  renewSelf: async (increment?: number): Promise<RenewTokenResponse> => {
    return apiClient.post<RenewTokenResponse>(VAULT_ROUTES.AUTH.TOKEN_RENEW_SELF, increment ? { increment } : {});
  },

  /**
   * Revoke a token
   */
  revoke: async (token: string): Promise<void> => {
    await apiClient.post(VAULT_ROUTES.AUTH.TOKEN_REVOKE, { token });
  },

  /**
   * Revoke the current token (self)
   */
  revokeSelf: async (): Promise<void> => {
    await apiClient.post(VAULT_ROUTES.AUTH.TOKEN_REVOKE_SELF, {});
  },
};

