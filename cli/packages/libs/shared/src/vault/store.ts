/**
 * RustyVault Store
 * Zustand store for vault state management across all UIs
 */

import { create } from 'zustand';
import { createVaultClient, VaultClient } from './client';
import type { VaultCapability, VaultTokenInfo } from './types';

const VAULT_TOKEN_KEY = 'vault_token';
const VAULT_POLICIES_KEY = 'vault_policies';

function loadFromStorage(): { token: string | null; policies: string[] } {
  if (typeof window === 'undefined') {
    return { token: null, policies: [] };
  }
  
  return {
    token: sessionStorage.getItem(VAULT_TOKEN_KEY),
    policies: JSON.parse(sessionStorage.getItem(VAULT_POLICIES_KEY) || '[]'),
  };
}

function saveToStorage(token: string | null, policies: string[]): void {
  if (typeof window === 'undefined') return;
  
  if (token) {
    sessionStorage.setItem(VAULT_TOKEN_KEY, token);
    sessionStorage.setItem(VAULT_POLICIES_KEY, JSON.stringify(policies));
  } else {
    sessionStorage.removeItem(VAULT_TOKEN_KEY);
    sessionStorage.removeItem(VAULT_POLICIES_KEY);
  }
}

export interface VaultState {
  // Connection state
  client: VaultClient;
  isConnected: boolean;
  isSealed: boolean;
  isInitialized: boolean;
  
  // Auth state  
  token: string | null;
  tokenInfo: VaultTokenInfo | null;
  policies: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Capabilities cache
  capabilitiesCache: Record<string, VaultCapability[]>;
}

export interface VaultActions {
  // Connection
  connect: (baseUrl?: string) => Promise<void>;
  checkHealth: () => Promise<void>;
  
  // Auth
  loginWithToken: (token: string) => Promise<void>;
  loginWithUserpass: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  
  // Capabilities
  getCapabilities: (path: string) => Promise<VaultCapability[]>;
  hasCapability: (path: string, capability: VaultCapability) => Promise<boolean>;
  canRead: (path: string) => Promise<boolean>;
  canWrite: (path: string) => Promise<boolean>;
  canDelete: (path: string) => Promise<boolean>;
  canList: (path: string) => Promise<boolean>;
  clearCapabilitiesCache: () => void;
  
  // Helpers
  isRoot: () => boolean;
  hasPolicy: (policyName: string) => boolean;
  clearError: () => void;
}

export type VaultStore = VaultState & VaultActions;

const stored = loadFromStorage();

const initialState: VaultState = {
  client: createVaultClient(),
  isConnected: false,
  isSealed: true,
  isInitialized: false,
  token: stored.token,
  tokenInfo: null,
  policies: stored.policies,
  isAuthenticated: !!stored.token,
  isLoading: false,
  error: null,
  capabilitiesCache: {},
};

export const useVaultStore = create<VaultStore>((set, get) => ({
  ...initialState,

  connect: async (baseUrl?: string) => {
    const client = createVaultClient(baseUrl);
    set({ client, isLoading: true, error: null });
    
    try {
      const health = await client.health();
      set({
        isConnected: true,
        isSealed: health.sealed,
        isInitialized: health.initialized,
        isLoading: false,
      });
      
      // Restore token if available
      const { token } = get();
      if (token) {
        client.setToken(token);
        try {
          const tokenInfo = await client.lookupSelf();
          set({ tokenInfo, policies: tokenInfo.policies, isAuthenticated: true });
        } catch {
          // Token invalid, clear it
          set({ token: null, tokenInfo: null, policies: [], isAuthenticated: false });
          saveToStorage(null, []);
        }
      }
    } catch (error) {
      set({
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to connect to vault',
      });
    }
  },

  checkHealth: async () => {
    const { client } = get();
    try {
      const health = await client.health();
      set({
        isSealed: health.sealed,
        isInitialized: health.initialized,
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Health check failed',
      });
    }
  },

  loginWithToken: async (token: string) => {
    const { client } = get();
    set({ isLoading: true, error: null });
    
    try {
      client.setToken(token);
      const tokenInfo = await client.lookupSelf();
      
      set({
        token,
        tokenInfo,
        policies: tokenInfo.policies,
        isAuthenticated: true,
        isLoading: false,
        capabilitiesCache: {},
      });
      
      saveToStorage(token, tokenInfo.policies);
    } catch (error) {
      client.setToken(null);
      set({
        token: null,
        tokenInfo: null,
        policies: [],
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Invalid token',
      });
      throw error;
    }
  },

  loginWithUserpass: async (username: string, password: string) => {
    const { client } = get();
    set({ isLoading: true, error: null });
    
    try {
      const response = await client.loginUserpass(username, password);
      const token = response.auth?.clientToken || client.getToken();
      
      if (!token) {
        throw new Error('No token received');
      }
      
      const tokenInfo = await client.lookupSelf();
      
      set({
        token,
        tokenInfo,
        policies: tokenInfo.policies,
        isAuthenticated: true,
        isLoading: false,
        capabilitiesCache: {},
      });
      
      saveToStorage(token, tokenInfo.policies);
    } catch (error) {
      set({
        token: null,
        tokenInfo: null,
        policies: [],
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
      throw error;
    }
  },

  logout: () => {
    const { client } = get();
    
    // Try to revoke token
    client.revokeSelf().catch(() => {});
    
    set({
      token: null,
      tokenInfo: null,
      policies: [],
      isAuthenticated: false,
      capabilitiesCache: {},
      error: null,
    });
    
    saveToStorage(null, []);
  },

  refreshToken: async () => {
    const { client, token } = get();
    
    if (!token) {
      throw new Error('No token to refresh');
    }
    
    try {
      await client.renewSelf();
      const tokenInfo = await client.lookupSelf();
      set({ tokenInfo });
    } catch (error) {
      // Token refresh failed, log out
      get().logout();
      throw error;
    }
  },

  getCapabilities: async (path: string) => {
    const { client, capabilitiesCache, policies } = get();
    
    // Root has all capabilities
    if (policies.includes('root')) {
      return ['root', 'create', 'read', 'update', 'delete', 'list', 'sudo'] as VaultCapability[];
    }
    
    // Check cache
    if (capabilitiesCache[path]) {
      return capabilitiesCache[path];
    }
    
    try {
      const response = await client.checkCapabilities([path]);
      const caps = response[path] || response.capabilities || ['deny'];
      
      // Update cache
      set((state) => ({
        capabilitiesCache: {
          ...state.capabilitiesCache,
          [path]: caps,
        },
      }));
      
      return caps;
    } catch (error) {
      console.error('Failed to check capabilities:', error);
      return ['deny'] as VaultCapability[];
    }
  },

  hasCapability: async (path: string, capability: VaultCapability) => {
    const caps = await get().getCapabilities(path);
    if (caps.includes('deny')) return false;
    if (caps.includes('root')) return true;
    return caps.includes(capability);
  },

  canRead: async (path: string) => get().hasCapability(path, 'read'),
  canWrite: async (path: string) => {
    const caps = await get().getCapabilities(path);
    if (caps.includes('deny')) return false;
    if (caps.includes('root')) return true;
    return caps.includes('create') || caps.includes('update');
  },
  canDelete: async (path: string) => get().hasCapability(path, 'delete'),
  canList: async (path: string) => get().hasCapability(path, 'list'),

  clearCapabilitiesCache: () => {
    set({ capabilitiesCache: {} });
  },

  isRoot: () => {
    const { policies } = get();
    return policies.includes('root');
  },

  hasPolicy: (policyName: string) => {
    const { policies } = get();
    return policies.includes(policyName) || policies.includes('root');
  },

  clearError: () => {
    set({ error: null });
  },
}));

