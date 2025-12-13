/**
 * RustyVault React Components
 * Reusable components for vault integration in all UIs
 */

import { type ReactNode, useEffect, useCallback } from 'react';
import { useVaultStore } from './store';
import { useVaultCapabilities, useVaultAuth } from './hooks';
import type { VaultCapability } from './types';

// ============================================
// Permission Gate Component
// ============================================

interface VaultPermissionGateProps {
  /** Vault path to check permissions for */
  path: string;
  /** Required capability */
  capability?: 'read' | 'write' | 'delete' | 'list';
  /** Children to render if permitted */
  children: ReactNode;
  /** Fallback if denied */
  fallback?: ReactNode;
  /** Show loading state */
  showLoading?: boolean;
  /** Show access denied message */
  showDenied?: boolean;
}

/**
 * Gate component that checks vault ACL before rendering children
 */
export function VaultPermissionGate({
  path,
  capability = 'read',
  children,
  fallback,
  showLoading = false,
  showDenied = false,
}: VaultPermissionGateProps) {
  const { isRoot } = useVaultAuth();
  const { capabilities, loading, isDenied } = useVaultCapabilities(path);

  // Root users have all permissions
  if (isRoot) {
    return <>{children}</>;
  }

  if (loading && showLoading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-full" />
    );
  }

  const hasPermission = (() => {
    if (isDenied) return false;
    if (capabilities.includes('root')) return true;

    switch (capability) {
      case 'read':
        return capabilities.includes('read');
      case 'write':
        return capabilities.includes('create') || capabilities.includes('update');
      case 'delete':
        return capabilities.includes('delete');
      case 'list':
        return capabilities.includes('list');
      default:
        return false;
    }
  })();

  if (hasPermission) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showDenied) {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-md">
        <p className="text-sm text-red-800">
          Access denied for vault path: {path}
        </p>
      </div>
    );
  }

  return null;
}

// ============================================
// Vault Provider Component
// ============================================

interface VaultProviderProps {
  /** Vault server URL */
  baseUrl?: string;
  /** Auto-connect on mount */
  autoConnect?: boolean;
  /** Children */
  children: ReactNode;
}

/**
 * Provider component that initializes vault connection
 */
export function VaultProvider({
  baseUrl,
  autoConnect = true,
  children,
}: VaultProviderProps) {
  const { connect, isConnected } = useVaultStore();

  useEffect(() => {
    if (autoConnect && !isConnected) {
      connect(baseUrl);
    }
  }, [autoConnect, baseUrl, connect, isConnected]);

  return <>{children}</>;
}

// ============================================
// Combined Permission Component
// ============================================

interface CombinedPermissionGateProps {
  /** Health-v1 permissions to check (uses external permission check) */
  healthPermissions?: string[];
  /** Health permission mode: 'all' or 'any' */
  healthMode?: 'all' | 'any';
  /** Health permission check function from the app */
  checkHealthPermission?: (permission: string) => boolean;
  /** Vault path to check */
  vaultPath?: string;
  /** Vault capability required */
  vaultCapability?: 'read' | 'write' | 'delete' | 'list';
  /** Children to render if all permissions pass */
  children: ReactNode;
  /** Fallback if denied */
  fallback?: ReactNode;
}

/**
 * Combined permission gate that checks both health-v1 and vault permissions
 * 
 * @example
 * ```tsx
 * const { hasPermission } = usePermissions(); // from health-v1
 * 
 * <CombinedPermissionGate
 *   healthPermissions={['patients:view']}
 *   checkHealthPermission={hasPermission}
 *   vaultPath="secret/data/patients/*"
 *   vaultCapability="read"
 * >
 *   <PatientSecrets />
 * </CombinedPermissionGate>
 * ```
 */
export function CombinedPermissionGate({
  healthPermissions = [],
  healthMode = 'all',
  checkHealthPermission,
  vaultPath,
  vaultCapability = 'read',
  children,
  fallback,
}: CombinedPermissionGateProps) {
  const { capabilities, loading: vaultLoading, isDenied } = useVaultCapabilities(
    vaultPath || ''
  );
  const { isRoot } = useVaultAuth();

  // Check health-v1 permissions
  const hasHealthPermission = useCallback(() => {
    if (!checkHealthPermission || healthPermissions.length === 0) {
      return true;
    }

    if (healthMode === 'all') {
      return healthPermissions.every(checkHealthPermission);
    }
    return healthPermissions.some(checkHealthPermission);
  }, [checkHealthPermission, healthPermissions, healthMode]);

  // Check vault permissions
  const hasVaultPermission = useCallback(() => {
    if (!vaultPath) return true;
    if (isRoot) return true;
    if (isDenied) return false;
    if (capabilities.includes('root')) return true;

    switch (vaultCapability) {
      case 'read':
        return capabilities.includes('read');
      case 'write':
        return capabilities.includes('create') || capabilities.includes('update');
      case 'delete':
        return capabilities.includes('delete');
      case 'list':
        return capabilities.includes('list');
      default:
        return false;
    }
  }, [vaultPath, isRoot, isDenied, capabilities, vaultCapability]);

  if (vaultLoading) {
    return null;
  }

  if (hasHealthPermission() && hasVaultPermission()) {
    return <>{children}</>;
  }

  return <>{fallback}</> || null;
}

// ============================================
// Vault Status Component
// ============================================

interface VaultStatusProps {
  /** Show detailed status */
  detailed?: boolean;
  /** Custom class name */
  className?: string;
}

/**
 * Component showing vault connection and seal status
 */
export function VaultStatus({ detailed = false, className = '' }: VaultStatusProps) {
  const { isConnected, isSealed, isInitialized } = useVaultStore();
  const { isAuthenticated } = useVaultAuth();

  const getStatusColor = () => {
    if (!isConnected) return 'bg-gray-400';
    if (isSealed) return 'bg-yellow-400';
    if (!isAuthenticated) return 'bg-orange-400';
    return 'bg-green-400';
  };

  const getStatusText = () => {
    if (!isConnected) return 'Disconnected';
    if (!isInitialized) return 'Not Initialized';
    if (isSealed) return 'Sealed';
    if (!isAuthenticated) return 'Unauthenticated';
    return 'Connected';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-sm">{getStatusText()}</span>
      {detailed && (
        <span className="text-xs text-gray-500">
          {isConnected && isAuthenticated && '(Vault)'}
        </span>
      )}
    </div>
  );
}

// ============================================
// HOC for Protected Components
// ============================================

/**
 * Higher-order component for vault-protected components
 */
export function withVaultPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  path: string,
  capability: 'read' | 'write' | 'delete' | 'list' = 'read'
) {
  return function VaultProtectedComponent(props: P) {
    const { capabilities, loading, isDenied, isRoot } = useVaultCapabilities(path);

    if (loading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
        </div>
      );
    }

    const hasPermission = (() => {
      if (isRoot) return true;
      if (isDenied) return false;
      if (capabilities.includes('root')) return true;

      switch (capability) {
        case 'read':
          return capabilities.includes('read');
        case 'write':
          return capabilities.includes('create') || capabilities.includes('update');
        case 'delete':
          return capabilities.includes('delete');
        case 'list':
          return capabilities.includes('list');
        default:
          return false;
      }
    })();

    if (!hasPermission) {
      return (
        <div className="p-8 text-center">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="mt-2 text-sm text-gray-500">
            You don't have {capability} permission for this vault path.
          </p>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

