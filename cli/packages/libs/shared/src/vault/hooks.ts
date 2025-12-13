/**
 * RustyVault React Hooks
 * Custom hooks for vault integration in React components
 */

import { useCallback, useEffect, useState } from 'react';
import { useVaultStore } from './store';
import type { VaultCapability, VaultSecret } from './types';

/**
 * Hook for checking vault capabilities on a path
 */
export function useVaultCapabilities(path: string) {
  const { getCapabilities, isRoot, isAuthenticated } = useVaultStore();
  const [capabilities, setCapabilities] = useState<VaultCapability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setCapabilities(['deny']);
      setLoading(false);
      return;
    }

    if (isRoot()) {
      setCapabilities(['root', 'create', 'read', 'update', 'delete', 'list', 'sudo']);
      setLoading(false);
      return;
    }

    setLoading(true);
    getCapabilities(path)
      .then(setCapabilities)
      .finally(() => setLoading(false));
  }, [path, getCapabilities, isRoot, isAuthenticated]);

  return {
    capabilities,
    loading,
    canRead: capabilities.includes('read') || capabilities.includes('root'),
    canWrite: capabilities.includes('create') || capabilities.includes('update') || capabilities.includes('root'),
    canDelete: capabilities.includes('delete') || capabilities.includes('root'),
    canList: capabilities.includes('list') || capabilities.includes('root'),
    isDenied: capabilities.includes('deny'),
    isRoot: capabilities.includes('root'),
  };
}

/**
 * Hook for reading a secret from vault
 */
export function useVaultSecret<T = Record<string, unknown>>(
  mount: string,
  path: string,
  options?: { enabled?: boolean; version?: number }
) {
  const { client, isAuthenticated } = useVaultStore();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const enabled = options?.enabled !== false;

  const refetch = useCallback(async () => {
    if (!isAuthenticated || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await client.kvRead<T>(mount, path, options?.version);
      setData(response.data?.data || null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to fetch secret'));
    } finally {
      setLoading(false);
    }
  }, [client, mount, path, options?.version, isAuthenticated, enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

/**
 * Hook for writing a secret to vault
 */
export function useVaultSecretMutation(mount: string) {
  const { client, clearCapabilitiesCache } = useVaultStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const writeSecret = useCallback(
    async <T = Record<string, unknown>>(path: string, data: T) => {
      setLoading(true);
      setError(null);

      try {
        const response = await client.kvWrite(mount, path, data);
        clearCapabilitiesCache();
        return response;
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to write secret');
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, mount, clearCapabilitiesCache]
  );

  const deleteSecret = useCallback(
    async (path: string, versions?: number[]) => {
      setLoading(true);
      setError(null);

      try {
        await client.kvDelete(mount, path, versions);
        clearCapabilitiesCache();
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to delete secret');
        setError(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [client, mount, clearCapabilitiesCache]
  );

  return { writeSecret, deleteSecret, loading, error };
}

/**
 * Hook for listing secrets in a path
 */
export function useVaultSecretList(mount: string, path: string = '') {
  const { client, isAuthenticated } = useVaultStore();
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const result = await client.kvList(mount, path);
      setKeys(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to list secrets'));
    } finally {
      setLoading(false);
    }
  }, [client, mount, path, isAuthenticated]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { keys, loading, error, refetch };
}

/**
 * Hook for vault authentication state
 */
export function useVaultAuth() {
  const {
    isAuthenticated,
    isLoading,
    error,
    token,
    tokenInfo,
    policies,
    loginWithToken,
    loginWithUserpass,
    logout,
    clearError,
    isRoot,
    hasPolicy,
  } = useVaultStore();

  return {
    isAuthenticated,
    isLoading,
    error,
    token,
    tokenInfo,
    policies,
    loginWithToken,
    loginWithUserpass,
    logout,
    clearError,
    isRoot: isRoot(),
    hasPolicy,
  };
}

/**
 * Hook for vault connection state
 */
export function useVaultConnection() {
  const {
    isConnected,
    isSealed,
    isInitialized,
    client,
    connect,
    checkHealth,
  } = useVaultStore();

  return {
    isConnected,
    isSealed,
    isInitialized,
    client,
    connect,
    checkHealth,
  };
}

/**
 * Hook that combines health-v1 permissions with vault capabilities
 * Use this in admin/client apps to check both permission systems
 */
export function useCombinedPermissions(
  healthPermission: string,
  vaultPath?: string
) {
  const { capabilities: vaultCaps, loading: vaultLoading } = useVaultCapabilities(
    vaultPath || ''
  );

  // This hook is meant to be used alongside the existing usePermissions hook
  // from @health-v1/shared or the app's own permission system
  
  return {
    vaultCapabilities: vaultCaps,
    vaultLoading,
    canAccessVault: !vaultCaps.includes('deny'),
    canReadVault: vaultCaps.includes('read') || vaultCaps.includes('root'),
    canWriteVault: vaultCaps.includes('create') || vaultCaps.includes('update') || vaultCaps.includes('root'),
    canDeleteVault: vaultCaps.includes('delete') || vaultCaps.includes('root'),
  };
}

