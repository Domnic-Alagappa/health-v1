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
import type { User } from "@health-v1/shared/types/user"
import { SECURITY_CONFIG } from "@health-v1/shared/constants/security"

const TOKEN_STORAGE_KEY_ACCESS = "auth_access_token"
const TOKEN_STORAGE_KEY_REFRESH = "auth_refresh_token"
const USER_STORAGE_KEY = "auth_user"

/**
 * Load tokens from sessionStorage
 */
function loadTokensFromStorage(): { accessToken: string | null; refreshToken: string | null } {
  if (typeof window === "undefined") {
    return { accessToken: null, refreshToken: null }
  }

  return {
    accessToken: sessionStorage.getItem(TOKEN_STORAGE_KEY_ACCESS),
    refreshToken: sessionStorage.getItem(TOKEN_STORAGE_KEY_REFRESH),
  }
}

/**
 * Save tokens to sessionStorage
 */
function saveTokensToStorage(accessToken: string | null, refreshToken: string | null): void {
  if (typeof window === "undefined") return

  if (accessToken) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY_ACCESS, accessToken)
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY_ACCESS)
  }

  if (refreshToken) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY_REFRESH, refreshToken)
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY_REFRESH)
  }
}

/**
 * Load user from sessionStorage
 */
function loadUserFromStorage(): User | null {
  if (typeof window === "undefined") return null

  const userStr = sessionStorage.getItem(USER_STORAGE_KEY)
  if (!userStr) return null

  try {
    return JSON.parse(userStr) as User
  } catch {
    return null
  }
}

/**
 * Save user to sessionStorage
 */
function saveUserToStorage(user: User | null): void {
  if (typeof window === "undefined") return

  if (user) {
    sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  } else {
    sessionStorage.removeItem(USER_STORAGE_KEY)
  }
}

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

// Initialize state from sessionStorage if available
const storedTokens = loadTokensFromStorage()
const storedUser = loadUserFromStorage()

const initialState: AuthState = {
  user: storedUser,
  accessToken: storedTokens.accessToken,
  refreshToken: storedTokens.refreshToken,
  isAuthenticated: !!storedTokens.accessToken,
  isLoading: false,
  error: null,
  permissions: storedUser?.permissions || [],
  role: storedUser?.role || null,
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

        // Persist to sessionStorage
        saveTokensToStorage(response.accessToken, response.refreshToken)
        saveUserToStorage(response.user)

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

        // Clear from sessionStorage
        saveTokensToStorage(null, null)
        saveUserToStorage(null)

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

        // Persist to sessionStorage
        saveTokensToStorage(response.accessToken, response.refreshToken)

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

        // Clear from sessionStorage
        saveTokensToStorage(null, null)
        saveUserToStorage(null)

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

      // Persist to sessionStorage
      saveTokensToStorage(accessToken, refreshToken)

      apiClient.setAuthTokens(accessToken, refreshToken)
    },

    clearError: () => {
      set((state) => {
        state.error = null
      })
    },

    checkAuth: async () => {
      // First try to restore from sessionStorage
      const storedTokens = loadTokensFromStorage()
      const storedUser = loadUserFromStorage()

      if (storedTokens.accessToken && storedUser) {
        set((state) => {
          state.accessToken = storedTokens.accessToken
          state.refreshToken = storedTokens.refreshToken
          state.user = storedUser
          state.isAuthenticated = true
          state.permissions = storedUser.permissions || []
          state.role = storedUser.role || null
        })
        apiClient.setAuthTokens(storedTokens.accessToken, storedTokens.refreshToken)
      }

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
          } else {
            // Set user if not already set
            state.user = userInfo
            state.permissions = userInfo.permissions || []
            state.role = userInfo.role || null
          }
          state.isLoading = false
        })

        // Persist updated user info
        const currentUser = get().user
        if (currentUser) {
          saveUserToStorage(currentUser)
        }
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
            } else {
              state.user = userInfo
              state.permissions = userInfo.permissions || []
              state.role = userInfo.role || null
            }
            state.isLoading = false
          })

          // Persist updated user info
          const currentUser = get().user
          if (currentUser) {
            saveUserToStorage(currentUser)
          }
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

          // Clear from sessionStorage
          saveTokensToStorage(null, null)
          saveUserToStorage(null)
          apiClient.setAuthTokens(null, null)
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
