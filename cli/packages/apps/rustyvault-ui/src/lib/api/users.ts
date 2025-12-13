import { apiClient } from './client';

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
    return apiClient.get<UserListResponse>('/auth/userpass/users');
  },

  /**
   * Read a specific user
   */
  read: async (username: string): Promise<{ data: User }> => {
    return apiClient.get<{ data: User }>(`/auth/userpass/users/${username}`);
  },

  /**
   * Create or update a user
   */
  write: async (username: string, request: CreateUserRequest): Promise<void> => {
    await apiClient.post(`/auth/userpass/users/${username}`, request);
  },

  /**
   * Delete a user
   */
  delete: async (username: string): Promise<void> => {
    await apiClient.delete(`/auth/userpass/users/${username}`);
  },

  /**
   * Login with username and password
   */
  login: async (username: string, password: string): Promise<LoginResponse> => {
    return apiClient.post<LoginResponse>(`/auth/userpass/login/${username}`, { password });
  },
};

