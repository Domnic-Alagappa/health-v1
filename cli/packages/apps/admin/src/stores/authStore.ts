/**
 * Auth Store
 * Authentication state management with Zustand and Immer
 */

import { login as apiLogin, logout as apiLogout, getUserInfo } from "@/lib/api/auth";
import type { UserInfo } from "@/lib/api/types";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

const USER_STORAGE_KEY = "admin_auth_user";

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
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserInfo) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

// Initialize state from sessionStorage if available
const storedUser = loadUserFromStorage();

const initialState: AuthState = {
  user: storedUser,
  isAuthenticated: !!storedUser,
  isLoading: false,
  error: null,
};

export const useAuthStore = create<AuthStore>()(
  immer((set) => ({
    ...initialState,

    login: async (email: string, password: string) => {
      set((state) => {
        state.isLoading = true;
        state.error = null;
      });

      try {
        const response = await apiLogin({ email, password });

        // Session is automatically set via cookie, we just store user info
        const userInfo = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.username || response.user.email,
          role: response.user.role,
          permissions: response.user.permissions || [],
        };

        set((state) => {
          state.user = userInfo;
          state.isAuthenticated = true;
          state.isLoading = false;
        });

        // Persist user info to sessionStorage (for UI state, not auth)
        saveUserToStorage(userInfo);
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
      try {
        // Session cookie will be cleared by the backend
        await apiLogout();
      } catch (error) {
        // Continue with logout even if API call fails
        console.error("Logout API call failed:", error);
      } finally {
        // Clear state and storage
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.error = null;
        });

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

    clearError: () => {
      set((state) => {
        state.error = null;
      });
    },

    checkAuth: async () => {
      set((state) => {
        state.isLoading = true;
      });

      try {
        // Check authentication via session cookie
        // Session is automatically sent by browser
        const userInfo = await getUserInfo();
        set((state) => {
          state.user = userInfo;
          state.isAuthenticated = true;
          state.isLoading = false;
        });
        saveUserToStorage(userInfo);
      } catch (error) {
        // If session is invalid, clear auth state
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.isLoading = false;
        });
        saveUserToStorage(null);
      }
    },
  }))
);

