import { ReactNode } from 'react';
import { useCapabilities, useAuthStore } from '@/stores/authStore';
import { AlertCircle, Lock } from 'lucide-react';
import { Card, CardContent } from '@health-v1/ui-components';

interface PermissionGateProps {
  /** The vault path to check permissions for */
  path: string;
  /** Required capability (read, write, delete, list) */
  capability?: 'read' | 'write' | 'delete' | 'list';
  /** Children to render if permission is granted */
  children: ReactNode;
  /** What to render if permission is denied (optional) */
  fallback?: ReactNode;
  /** Show loading state while checking */
  showLoading?: boolean;
  /** Show access denied message (default: false) */
  showDenied?: boolean;
}

/**
 * Component to conditionally render children based on ACL permissions
 * 
 * @example
 * ```tsx
 * <PermissionGate path="secret/data/myapp" capability="write">
 *   <Button>Create Secret</Button>
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  path,
  capability = 'read',
  children,
  fallback,
  showLoading = false,
  showDenied = false,
}: PermissionGateProps) {
  const { capabilities, loading, isDenied } = useCapabilities(path);
  const { isRoot } = useAuthStore();

  // Root users have all permissions
  if (isRoot()) {
    return <>{children}</>;
  }

  // Show loading state
  if (loading && showLoading) {
    return (
      <div className="animate-pulse bg-muted rounded h-8 w-full" />
    );
  }

  // Check specific capability
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

  // Return fallback or denied message
  if (fallback) {
    return <>{fallback}</>;
  }

  if (showDenied) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="flex items-center gap-3 py-4">
          <Lock className="h-5 w-5 text-destructive" />
          <div>
            <p className="font-medium text-destructive">Access Denied</p>
            <p className="text-sm text-muted-foreground">
              You don't have {capability} permission for this path
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}

/**
 * Hook-based permission check for more complex scenarios
 */
export function useHasPermission(path: string, capability: 'read' | 'write' | 'delete' | 'list') {
  const { capabilities, loading, isDenied } = useCapabilities(path);
  const { isRoot } = useAuthStore();

  if (isRoot()) {
    return { hasPermission: true, loading: false };
  }

  if (loading) {
    return { hasPermission: false, loading: true };
  }

  if (isDenied) {
    return { hasPermission: false, loading: false };
  }

  const hasPermission = (() => {
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

  return { hasPermission, loading: false };
}

/**
 * Higher-order component for permission-protected pages
 */
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  path: string,
  capability: 'read' | 'write' | 'delete' | 'list' = 'read'
) {
  return function PermissionProtectedComponent(props: P) {
    const { hasPermission, loading } = useHasPermission(path, capability);

    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    if (!hasPermission) {
      return (
        <div className="flex items-center justify-center p-8">
          <Card className="max-w-md">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div className="text-center">
                <h2 className="text-lg font-semibold">Access Denied</h2>
                <p className="text-muted-foreground mt-2">
                  You don't have permission to access this page.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Required: {capability} on {path}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

