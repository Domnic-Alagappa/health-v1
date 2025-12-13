import { apiClient } from './client';
import { VAULT_ROUTES } from './routes';

export interface User {
  username: string;
  policies: string[];
  ttl: number;
  max_ttl: number;
}

export interface UserListResponse {
  keys: string[];
}

export interface CreateUserRequest {
  password: string;
  policies?: string[];
  ttl?: number;
  max_ttl?: number;
}

export interface LoginResponse {
  auth: {
    client_token: string;
    accessor: string;
    policies: string[];
    token_ttl: number;
    renewable: boolean;
  };
}

export const usersApi = {
  /**
   * List all userpass users
   */
  list: async (): Promise<UserListResponse> => {
    return apiClient.get<UserListResponse>(VAULT_ROUTES.AUTH.USERPASS_USERS);
  },

  /**
   * Read a specific user
   */
  read: async (username: string): Promise<{ data: User }> => {
    return apiClient.get<{ data: User }>(VAULT_ROUTES.AUTH.USERPASS_USER(username));
  },

  /**
   * Create or update a user
   */
  write: async (username: string, request: CreateUserRequest): Promise<void> => {
    await apiClient.post(VAULT_ROUTES.AUTH.USERPASS_USER(username), request);
  },

  /**
   * Delete a user
   */
  delete: async (username: string): Promise<void> => {
    await apiClient.delete(VAULT_ROUTES.AUTH.USERPASS_USER(username));
  },

  /**
   * Login with username and password
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>(VAULT_ROUTES.AUTH.USERPASS_LOGIN(username), { password });
  },
};

