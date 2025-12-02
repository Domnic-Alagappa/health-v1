/**
 * Auth Store
 * Authentication state management with Zustand and Immer
 */

import { login as apiLogin, logout as apiLogout, getUserInfo } from "@/lib/api/auth";
import type { LoginRequest, LoginResponse, UserInfo } from "@/lib/api/types";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const TOKEN_STORAGE_KEY_ACCESS = "admin_auth_access_token";
const TOKEN_STORAGE_KEY_REFRESH = "admin_auth_refresh_token";
const USER_STORAGE_KEY = "admin_auth_user";

/**
 * Load tokens from sessionStorage
 */
function loadTokensFromStorage(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null };
  }

  return {
    accessToken: sessionStorage.getItem(TOKEN_STORAGE_KEY_ACCESS),
    refreshToken: sessionStorage.getItem(TOKEN_STORAGE_KEY_REFRESH),
  };
}

/**
 * Save tokens to sessionStorage
 */
function saveTokensToStorage(accessToken: string | null, refreshToken: string | null): void {
  if (typeof window === "undefined") return;

  if (accessToken) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY_ACCESS, accessToken);
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY_ACCESS);
  }

  if (refreshToken) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY_REFRESH, refreshToken);
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY_REFRESH);
  }
}

/**
 * Load user from sessionStorage
 */
function loadUserFromStorage(): UserInfo | null {
  if (typeof window === "undefined") return null;

  const userStr = sessionStorage.getItem(USER_STORAGE_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as UserInfo;
  } catch {
    return null;
  }
}

/**
 * Save user to sessionStorage
 */
function saveUserToStorage(user: UserInfo | null): void {
  if (typeof window === "undefined") return;

  if (user) {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(USER_STORAGE_KEY);
  }
}

interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserInfo) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

// Initialize state from sessionStorage if available
const storedTokens = loadTokensFromStorage();
const storedUser = loadUserFromStorage();

const initialState: AuthState = {
  user: storedUser,
  accessToken: storedTokens.accessToken,
  refreshToken: storedTokens.refreshToken,
  isAuthenticated: !!storedTokens.accessToken,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  immer((set, get) => ({
    ...initialState,

    login: async (email: string, password: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await apiLogin({ email, password });

        set((state) => {
          state.accessToken = response.accessToken;
          state.refreshToken = response.refreshToken;
          state.user = {
            id: response.user.id,
            email: response.user.email,
            name: response.user.username || response.user.email,
            role: response.user.role,
            permissions: response.user.permissions || [],
          };
          state.isAuthenticated = true;
          state.isLoading = false;
        });

        // Persist to sessionStorage
        saveTokensToStorage(response.accessToken, response.refreshToken);
        saveUserToStorage({
          id: response.user.id,
          email: response.user.email,
          name: response.user.username || response.user.email,
          role: response.user.role,
          permissions: response.user.permissions || [],
        });
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Login failed";
          state.isLoading = false;
          state.isAuthenticated = false;
        });
        throw error;
      }
    },

    logout: async () => {
      const { refreshToken } = get();

      try {
        if (refreshToken) {
          await apiLogout(refreshToken);
        }
      } catch (error) {
        // Continue with logout even if API call fails
        console.error("Logout API call failed:", error);
      } finally {
        // Clear state and storage
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.error = null;
        });

        saveTokensToStorage(null, null);
        saveUserToStorage(null);
      }
    },

    setUser: (user: UserInfo) => {
      set((state) => {
        state.user = user;
        state.isAuthenticated = true;
      });
      saveUserToStorage(user);
    },

    setTokens: (accessToken: string | null, refreshToken: string | null) => {
      set((state) => {
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.isAuthenticated = !!accessToken;
      });

      // Persist to sessionStorage
      saveTokensToStorage(accessToken, refreshToken);
    },

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },

    checkAuth: async () => {
      // First try to restore from sessionStorage
      const storedTokens = loadTokensFromStorage();
      const storedUser = loadUserFromStorage();

      if (storedTokens.accessToken && storedUser) {
        set((state) => {
          state.accessToken = storedTokens.accessToken;
          state.refreshToken = storedTokens.refreshToken;
          state.user = storedUser;
          state.isAuthenticated = true;
        });
      }

      const { accessToken } = get();

      if (!accessToken) {
        return;
      }

      set((state) => {
        state.isLoading = true;
      });

      try {
        const userInfo = await getUserInfo(accessToken);
        set((state) => {
          state.user = userInfo;
          state.isAuthenticated = true;
          state.isLoading = false;
        });
        saveUserToStorage(userInfo);
      } catch (error) {
        // If token is invalid, clear auth state
        set((state) => {
          state.user = null;
          state.accessToken = null;
          state.refreshToken = null;
          state.isAuthenticated = false;
          state.isLoading = false;
        });
        saveTokensToStorage(null, null);
        saveUserToStorage(null);
      }
    },
  }))
);

