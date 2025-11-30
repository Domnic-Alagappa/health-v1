/**
 * Auth Store Tests
 */

import * as authAPI from "@/lib/api/auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "./authStore";

// Mock the auth API
vi.mock("@/lib/api/auth", async () => {
  const actual = await vi.importActual("@/lib/api/auth");
  return {
    ...actual,
    login: vi.fn(),
    logout: vi.fn(),
    refreshAccessToken: vi.fn(),
    getUserInfo: vi.fn(),
  };
});

describe("Auth Store", () => {
  beforeEach(() => {
    // Reset store to initial state
    const state = useAuthStore.getState();
    state.setTokens(null, null);
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      permissions: [],
      role: null,
    });
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.permissions).toEqual([]);
    });
  });

  describe("setTokens", () => {
    it("should set access and refresh tokens", () => {
      const { setTokens } = useAuthStore.getState();
      setTokens("access-token", "refresh-token");

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe("access-token");
      expect(state.refreshToken).toBe("refresh-token");
    });

    it("should clear tokens when set to null", () => {
      const { setTokens } = useAuthStore.getState();
      setTokens("access-token", "refresh-token");
      setTokens(null, null);

      const state = useAuthStore.getState();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe("setUser", () => {
    it("should set user and update authentication state", () => {
      const { setUser } = useAuthStore.getState();
      const user = {
        id: "123",
        email: "test@example.com",
        username: "testuser",
        role: "doctor",
        permissions: ["patients:view"],
      };

      setUser(user);

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.isAuthenticated).toBe(true);
      expect(state.role).toBe("doctor");
      expect(state.permissions).toEqual(["patients:view"]);
    });
  });

  describe("login", () => {
    it("should login successfully", async () => {
      const mockUser = {
        id: "123",
        email: "test@example.com",
        username: "testuser",
        role: "doctor",
        permissions: ["patients:view"],
      };

      vi.mocked(authAPI.login).mockResolvedValueOnce({
        accessToken: "access-token",
        refreshToken: "refresh-token",
        expiresIn: 3600,
        user: mockUser,
      });

      const { login } = useAuthStore.getState();
      await login("test@example.com", "password");

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe("access-token");
      expect(state.refreshToken).toBe("refresh-token");
    });

    it("should handle login errors", async () => {
      vi.mocked(authAPI.login).mockRejectedValueOnce(new Error("Invalid credentials"));

      const { login } = useAuthStore.getState();
      await login("test@example.com", "wrong-password");

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeTruthy();
    });
  });

  describe("logout", () => {
    it("should logout and clear state", async () => {
      // Set up authenticated state
      const { setTokens, setUser } = useAuthStore.getState();
      setTokens("token", "refresh");
      setUser({
        id: "123",
        email: "test@example.com",
        username: "testuser",
        role: "doctor",
        permissions: [],
      });

      vi.mocked(authAPI.logout).mockResolvedValueOnce(undefined);

      const { logout } = useAuthStore.getState();
      await logout();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.refreshToken).toBeNull();
    });
  });

  describe("refreshToken", () => {
    it("should refresh access token", async () => {
      const { setTokens } = useAuthStore.getState();
      setTokens(null, "refresh-token");

      vi.mocked(authAPI.refreshAccessToken).mockResolvedValueOnce({
        accessToken: "new-access-token",
        refreshToken: "new-refresh-token",
        expiresIn: 3600,
      });

      const { refreshToken } = useAuthStore.getState();
      await refreshToken();

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe("new-access-token");
    });

    it("should handle refresh token errors", async () => {
      const { setTokens } = useAuthStore.getState();
      setTokens(null, "invalid-refresh-token");

      vi.mocked(authAPI.refreshAccessToken).mockRejectedValueOnce(new Error("Token expired"));

      const { refreshToken } = useAuthStore.getState();
      await refreshToken();

      const state = useAuthStore.getState();
      expect(state.error).toBeTruthy();
    });
  });

  describe("clearError", () => {
    it("should clear error state", () => {
      useAuthStore.setState({ error: "Some error" });

      const { clearError } = useAuthStore.getState();
      clearError();

      const state = useAuthStore.getState();
      expect(state.error).toBeNull();
    });
  });
});
