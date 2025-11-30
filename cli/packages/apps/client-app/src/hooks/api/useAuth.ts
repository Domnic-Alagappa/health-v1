/**
 * useAuth Hook
 * TanStack Query hooks for authentication
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getUserInfo, login, logout, refreshAccessToken } from "@/lib/api/auth"
import type { LoginRequest, UserInfo } from "@/lib/api/types"
import { useAuthStore } from "@/stores/authStore"

const AUTH_QUERY_KEYS = {
  userInfo: ["auth", "userInfo"] as const,
}

/**
 * Login mutation
 */
export function useLogin() {
  const queryClient = useQueryClient()
  const { setUser, setTokens } = useAuthStore()

  return useMutation({
    mutationFn: (credentials: LoginRequest) => login(credentials),
    onSuccess: (data) => {
      // Update auth store
      setTokens(data.accessToken, data.refreshToken)
      setUser(data.user)

      // Invalidate and refetch user info
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.userInfo })
    },
  })
}

/**
 * Logout mutation
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const { setTokens } = useAuthStore()

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      // Clear tokens
      setTokens(null, null)

      // Clear all queries
      queryClient.clear()
    },
  })
}

/**
 * Refresh token mutation
 */
export function useRefreshToken() {
  const { refreshToken } = useAuthStore()
  const { setTokens } = useAuthStore()

  return useMutation({
    mutationFn: (token: string) => refreshAccessToken(token),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken)
    },
  })
}

/**
 * Get user info query
 */
export function useUserInfo() {
  const { isAuthenticated } = useAuthStore()

  return useQuery({
    queryKey: AUTH_QUERY_KEYS.userInfo,
    queryFn: getUserInfo,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  })
}
