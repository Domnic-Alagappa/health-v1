import { apiClient } from './client';

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
    return apiClient.post<AuthResponse>(`/auth/userpass/login/${username}`, { password });
  },

  loginAppRole: async (roleId: string, secretId: string): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/approle/login', { role_id: roleId, secret_id: secretId });
  },

  lookupToken: async (token?: string): Promise<TokenLookupResponse> => {
    if (token) {
      return apiClient.post<TokenLookupResponse>('/auth/token/lookup', { token });
    }
    return apiClient.get<TokenLookupResponse>('/auth/token/lookup-self');
  },

  renewToken: async (increment?: number): Promise<AuthResponse> => {
    const data = increment ? { increment } : {};
    return apiClient.post<AuthResponse>('/auth/token/renew-self', data);
  },
};

