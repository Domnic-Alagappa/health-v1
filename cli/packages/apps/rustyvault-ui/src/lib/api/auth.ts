import { apiClient } from './client';
import { VAULT_ROUTES } from './routes';

export interface AuthResponse {
  auth?: {
    client_token: string;
    lease_duration?: number;
    renewable?: boolean;
    metadata?: Record<string, string>;
    policies?: string[];
  };
}

export interface TokenLookupResponse {
  data: {
    id: string;
    policies: string[];
    path: string;
    meta?: Record<string, string>;
    display_name?: string;
    ttl?: number;
    renewable?: boolean;
  };
}

export const authApi = {
  loginUserpass: async (username: string, password: string): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>(VAULT_ROUTES.AUTH.USERPASS_LOGIN(username), { password });
  },

  loginAppRole: async (roleId: string, secretId: string): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>(VAULT_ROUTES.AUTH.APPROLE_LOGIN, { role_id: roleId, secret_id: secretId });
  },

  lookupToken: async (token?: string): Promise<TokenLookupResponse> => {
    if (token) {
      // For token lookup, send the token in the request body
      // The endpoint doesn't require authentication header, but we include it for consistency
      const response = await apiClient.post<TokenLookupResponse>(
        VAULT_ROUTES.AUTH.TOKEN_LOOKUP, 
        { token }
      );
      // Ensure response has the expected structure
      if (response && typeof response === 'object' && 'data' in response) {
        return response as TokenLookupResponse;
      }
      // If response is unwrapped, wrap it
      return { data: response as any };
    }
    return apiClient.get<TokenLookupResponse>(VAULT_ROUTES.AUTH.TOKEN_LOOKUP_SELF);
  },

  renewToken: async (increment?: number): Promise<AuthResponse> => {
    const data = increment ? { increment } : {};
    return apiClient.post<AuthResponse>(VAULT_ROUTES.AUTH.TOKEN_RENEW_SELF, data);
  },
};

