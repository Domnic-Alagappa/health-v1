/**
 * Auth store types
 */

import type { User } from "../user";

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  permissions: string[];
  role: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export type AuthStore = AuthState & AuthActions;
