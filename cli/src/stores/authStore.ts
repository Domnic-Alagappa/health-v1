/**
 * Auth Store
 * Authentication state management with Zustand and Immer
 */

import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import {
  login as apiLogin,
  logout as apiLogout,
  getUserInfo,
  refreshAccessToken,
} from "@/lib/api/auth"
import { apiClient } from "@/lib/api/client"
import type { User } from "@/lib/api/types"
import { SECURITY_CONFIG } from "@/lib/constants/security"

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  permissions: string[]
  role: string | null
}

interface AuthActions {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<void>
  setUser: (user: User) => void
  setTokens: (accessToken: string | null, refreshToken: string | null) => void
  clearError: () => void
  checkAuth: () => Promise<void>
}

type AuthStore = AuthState & AuthActions

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  permissions: [],
  role: null,
}

export const useAuthStore = create<AuthStore>()(
  immer((set, get) => ({
    ...initialState,

    login: async (email: string, password: string) => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const response = await apiLogin({ email, password })

        set((state) => {
          state.accessToken = response.accessToken
          state.refreshToken = response.refreshToken
          state.user = response.user
          state.isAuthenticated = true
          state.permissions = response.user.permissions || []
          state.role = response.user.role
          state.isLoading = false
        })

        // Set tokens in API client
        apiClient.setAuthTokens(response.accessToken, response.refreshToken)
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : "Login failed"
          state.isLoading = false
          state.isAuthenticated = false
        })
        throw error
      }
    },

    logout: async () => {
      set((state) => {
        state.isLoading = true
      })

      try {
        await apiLogout()
      } catch (error) {
        // Continue with logout even if API call fails
        console.error("Logout error:", error)
      } finally {
        set((state) => {
          state.user = null
          state.accessToken = null
          state.refreshToken = null
          state.isAuthenticated = false
          state.permissions = []
          state.role = null
          state.isLoading = false
          state.error = null
        })

        // Clear tokens in API client
        apiClient.setAuthTokens(null, null)
      }
    },

    refreshToken: async () => {
      const { refreshToken: currentRefreshToken } = get()

      if (!currentRefreshToken) {
        throw new Error("No refresh token available")
      }

      try {
        const response = await refreshAccessToken(currentRefreshToken)

        set((state) => {
          state.accessToken = response.accessToken
          state.refreshToken = response.refreshToken
        })

        // Update tokens in API client
        apiClient.setAuthTokens(response.accessToken, response.refreshToken)
      } catch (error) {
        // Refresh failed, clear auth state
        set((state) => {
          state.user = null
          state.accessToken = null
          state.refreshToken = null
          state.isAuthenticated = false
          state.permissions = []
          state.role = null
        })

        apiClient.setAuthTokens(null, null)
        throw error
      }
    },

    setUser: (user: User) => {
      set((state) => {
        state.user = user
        state.permissions = user.permissions || []
        state.role = user.role
        state.isAuthenticated = true
      })
    },

    setTokens: (accessToken: string | null, refreshToken: string | null) => {
      set((state) => {
        state.accessToken = accessToken
        state.refreshToken = refreshToken
        state.isAuthenticated = !!accessToken
      })

      apiClient.setAuthTokens(accessToken, refreshToken)
    },

    clearError: () => {
      set((state) => {
        state.error = null
      })
    },

    checkAuth: async () => {
      const { accessToken } = get()

      if (!accessToken) {
        return
      }

      set((state) => {
        state.isLoading = true
      })

      try {
        const userInfo = await getUserInfo()

        set((state) => {
          if (state.user) {
            // Update existing user with fresh info
            state.user.email = userInfo.email
            state.user.role = userInfo.role || state.user.role
            state.permissions = userInfo.permissions || state.permissions
          }
          state.isLoading = false
        })
      } catch (error) {
        // Auth check failed, try to refresh token
        try {
          await get().refreshToken()
          // Retry user info after refresh
          const userInfo = await getUserInfo()
          set((state) => {
            if (state.user) {
              state.user.email = userInfo.email
              state.user.role = userInfo.role || state.user.role
              state.permissions = userInfo.permissions || state.permissions
            }
            state.isLoading = false
          })
        } catch (refreshError) {
          // Both check and refresh failed, clear auth
          set((state) => {
            state.user = null
            state.accessToken = null
            state.refreshToken = null
            state.isAuthenticated = false
            state.permissions = []
            state.role = null
            state.isLoading = false
          })
        }
      }
    },
  }))
)

// Selectors for better performance - use individual selectors to avoid object recreation
export const useAuth = () => {
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)
  const error = useAuthStore((state) => state.error)
  const permissions = useAuthStore((state) => state.permissions)
  const role = useAuthStore((state) => state.role)

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    permissions,
    role,
  }
}

export const useAuthActions = () =>
  useAuthStore((state) => ({
    login: state.login,
    logout: state.logout,
    refreshToken: state.refreshToken,
    setUser: state.setUser,
    setTokens: state.setTokens,
    clearError: state.clearError,
    checkAuth: state.checkAuth,
  }))

// Permission checking helper
export const useHasPermission = (permission: string): boolean => {
  const permissions = useAuthStore((state) => state.permissions)
  return permissions.includes(permission)
}

// Role checking helper
export const useHasRole = (role: string): boolean => {
  const userRole = useAuthStore((state) => state.role)
  return userRole === role
}
