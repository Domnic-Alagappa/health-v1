import { create } from 'zustand';
import { authApi } from '@/lib/api/auth';
import { policiesApi } from '@/lib/api/policies';

const TOKEN_STORAGE_KEY = 'rustyvault_token';
const POLICIES_STORAGE_KEY = 'rustyvault_policies';

function loadTokenFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_STORAGE_KEY);
}

function loadPoliciesFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  const policies = sessionStorage.getItem(POLICIES_STORAGE_KEY);
  return policies ? JSON.parse(policies) : [];
}

function saveTokenToStorage(token: string | null): void {
  if (typeof window === 'undefined') return;
  if (token) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

function savePoliciesToStorage(policies: string[]): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(POLICIES_STORAGE_KEY, JSON.stringify(policies));
}

interface AuthState {
  accessToken: string | null;
  policies: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  // Cached capabilities for paths
  capabilitiesCache: Record<string, string[]>;
}

interface AuthActions {
  login: (token: string) => Promise<void>;
  loginWithUserpass: (username: string, password: string) => Promise<void>;
  loginWithAppRole: (roleId: string, secretId: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  // ACL helpers
  hasPolicy: (policyName: string) => boolean;
  isRoot: () => boolean;
  getCapabilities: (path: string) => Promise<string[]>;
  hasCapability: (path: string, capability: string) => Promise<boolean>;
  canRead: (path: string) => Promise<boolean>;
  canWrite: (path: string) => Promise<boolean>;
  canDelete: (path: string) => Promise<boolean>;
  canList: (path: string) => Promise<boolean>;
}

type AuthStore = AuthState & AuthActions;

const storedToken = loadTokenFromStorage();
const storedPolicies = loadPoliciesFromStorage();

const initialState: AuthState = {
  accessToken: storedToken,
  policies: storedPolicies,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,
  capabilitiesCache: {},
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,

  login: async (token: string) => {
    set({ isLoading: true, error: null });
    try {
      // Validate token by looking it up
      const response = await authApi.lookupToken(token);
      const policies = response.data?.policies || [];
      set({ 
        accessToken: token, 
        policies,
        isAuthenticated: true, 
        isLoading: false,
        capabilitiesCache: {},
      });
      saveTokenToStorage(token);
      savePoliciesToStorage(policies);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid token';
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  loginWithUserpass: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.loginUserpass(username, password);
      const token = response.auth?.client_token;
      const policies = response.auth?.policies || [];
      if (!token) {
        throw new Error('No token received from server');
      }
      set({ 
        accessToken: token, 
        policies,
        isAuthenticated: true, 
        isLoading: false,
        capabilitiesCache: {},
      });
      saveTokenToStorage(token);
      savePoliciesToStorage(policies);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  loginWithAppRole: async (roleId: string, secretId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.loginAppRole(roleId, secretId);
      const token = response.auth?.client_token;
      const policies = response.auth?.policies || [];
      if (!token) {
        throw new Error('No token received from server');
      }
      set({ 
        accessToken: token, 
        policies,
        isAuthenticated: true, 
        isLoading: false,
        capabilitiesCache: {},
      });
      saveTokenToStorage(token);
      savePoliciesToStorage(policies);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      set({ error: message, isLoading: false, isAuthenticated: false });
      throw error;
    }
  },

  logout: () => {
    set({ 
      accessToken: null, 
      policies: [],
      isAuthenticated: false, 
      error: null,
      capabilitiesCache: {},
    });
    saveTokenToStorage(null);
    savePoliciesToStorage([]);
  },

  clearError: () => {
    set({ error: null });
  },

  checkAuth: async () => {
    const token = get().accessToken;
    if (!token) {
      set({ isAuthenticated: false, policies: [] });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await authApi.lookupToken(token);
      const policies = response.data?.policies || [];
      set({ 
        isAuthenticated: true, 
        policies,
        isLoading: false 
      });
      savePoliciesToStorage(policies);
    } catch {
      set({ 
        accessToken: null, 
        policies: [],
        isAuthenticated: false, 
        isLoading: false,
        capabilitiesCache: {},
      });
      saveTokenToStorage(null);
      savePoliciesToStorage([]);
    }
  },

  // Check if user has a specific policy
  hasPolicy: (policyName: string) => {
    const { policies } = get();
    return policies.includes(policyName) || policies.includes('root');
  },

  // Check if user has root policy
  isRoot: () => {
    const { policies } = get();
    return policies.includes('root');
  },

  // Get capabilities for a path
  getCapabilities: async (path: string) => {
    const { capabilitiesCache, policies, isRoot } = get();
    
    // Root has all capabilities
    if (isRoot()) {
      return ['root', 'create', 'read', 'update', 'delete', 'list', 'sudo'];
    }

    // Check cache first
    if (capabilitiesCache[path]) {
      return capabilitiesCache[path];
    }

    try {
      const response = await policiesApi.checkCapabilities(path, policies);
      const capabilities = response.capabilities || ['deny'];
      
      // Update cache
      set((state) => ({
        capabilitiesCache: {
          ...state.capabilitiesCache,
          [path]: capabilities,
        },
      }));

      return capabilities;
    } catch (error) {
      console.error('Failed to check capabilities:', error);
      return ['deny'];
    }
  },

  // Check if user has a specific capability for a path
  hasCapability: async (path: string, capability: string) => {
    const capabilities = await get().getCapabilities(path);
    if (capabilities.includes('deny')) return false;
    if (capabilities.includes('root')) return true;
    return capabilities.includes(capability);
  },

  // Convenience methods
  canRead: async (path: string) => {
    return get().hasCapability(path, 'read');
  },

  canWrite: async (path: string) => {
    const caps = await get().getCapabilities(path);
    return caps.includes('create') || caps.includes('update') || caps.includes('root');
  },

  canDelete: async (path: string) => {
    return get().hasCapability(path, 'delete');
  },

  canList: async (path: string) => {
    return get().hasCapability(path, 'list');
  },
}));

// Hook for checking capabilities in components
export function useCapabilities(path: string) {
  const { getCapabilities, isRoot } = useAuthStore();
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isRoot()) {
      setCapabilities(['root', 'create', 'read', 'update', 'delete', 'list', 'sudo']);
      setLoading(false);
      return;
    }

    getCapabilities(path).then((caps) => {
      setCapabilities(caps);
      setLoading(false);
    });
  }, [path, getCapabilities, isRoot]);

  return {
    capabilities,
    loading,
    canRead: capabilities.includes('read') || capabilities.includes('root'),
    canWrite: capabilities.includes('create') || capabilities.includes('update') || capabilities.includes('root'),
    canDelete: capabilities.includes('delete') || capabilities.includes('root'),
    canList: capabilities.includes('list') || capabilities.includes('root'),
    isDenied: capabilities.includes('deny'),
  };
}

// Need to import these for the hook
import { useState, useEffect } from 'react';
