/**
 * Permission Context and Hooks
 * Provides permission checking functionality throughout the admin UI
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  checkPermission,
  checkPermissionsBatch,
  getUserPermissions,
  type UserPermissionsResponse,
} from "../api/permissions";

interface PermissionContextValue {
  // Current user ID (should be set from auth context)
  currentUserId: string | null;
  setCurrentUserId: (userId: string | null) => void;
  
  // Permission checking functions
  canAccess: (relation: string, object: string) => Promise<boolean>;
  canAccessBatch: (checks: Array<[string, string]>) => Promise<boolean[]>;
  
  // Cached permission data
  userPermissions: UserPermissionsResponse | undefined;
  isLoadingPermissions: boolean;
  
  // Refresh permissions
  refreshPermissions: () => void;
}

const PermissionContext = createContext<PermissionContextValue | null>(null);

interface PermissionProviderProps {
  children: React.ReactNode;
  userId?: string | null;
}

/**
 * Permission Provider - wraps the app and provides permission context
 */
export function PermissionProvider({
  children,
  userId: initialUserId,
}: PermissionProviderProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(
    initialUserId || null
  );
  const queryClient = useQueryClient();

  // Fetch user permissions
  const {
    data: userPermissions,
    isLoading: isLoadingPermissions,
    refetch: refetchPermissions,
  } = useQuery({
    queryKey: ["userPermissions", currentUserId],
    queryFn: () => {
      if (!currentUserId) {
        throw new Error("User ID is required");
      }
      return getUserPermissions(currentUserId);
    },
    enabled: !!currentUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check single permission
  const canAccess = useCallback(
    async (relation: string, object: string): Promise<boolean> => {
      if (!currentUserId) {
        return false;
      }

      try {
        const response = await checkPermission(currentUserId, relation, object);
        return response.allowed;
      } catch (error) {
        console.error("Failed to check permission:", error);
        return false;
      }
    },
    [currentUserId]
  );

  // Batch check permissions
  const canAccessBatch = useCallback(
    async (checks: Array<[string, string]>): Promise<boolean[]> => {
      if (!currentUserId) {
        return checks.map(() => false);
      }

      try {
        const batchChecks: Array<[string, string, string]> = checks.map(
          ([relation, object]) => [currentUserId, relation, object]
        );
        const response = await checkPermissionsBatch(batchChecks);
        return response.results;
      } catch (error) {
        console.error("Failed to batch check permissions:", error);
        return checks.map(() => false);
      }
    },
    [currentUserId]
  );

  // Refresh permissions
  const refreshPermissions = useCallback(() => {
    if (currentUserId) {
      queryClient.invalidateQueries({ queryKey: ["userPermissions", currentUserId] });
      refetchPermissions();
    }
  }, [currentUserId, queryClient, refetchPermissions]);

  const value: PermissionContextValue = {
    currentUserId,
    setCurrentUserId,
    canAccess,
    canAccessBatch,
    userPermissions,
    isLoadingPermissions,
    refreshPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

/**
 * Hook to access permission context
 */
export function usePermissions(): PermissionContextValue {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermissions must be used within PermissionProvider");
  }
  return context;
}

/**
 * Hook to check if user can access a specific resource
 * @param relation - The relation (e.g., "can_view", "can_edit", "can_click")
 * @param object - The object (e.g., "page:users", "button:create-user")
 * @param fallback - Default value if permission check fails (default: false)
 */
export function useCanAccess(
  relation: string,
  object: string,
  fallback: boolean = false
): boolean {
  const { canAccess, currentUserId } = usePermissions();
  const [allowed, setAllowed] = useState<boolean>(fallback);

  useEffect(() => {
    if (!currentUserId) {
      setAllowed(fallback);
      return;
    }

    let cancelled = false;

    canAccess(relation, object)
      .then((result) => {
        if (!cancelled) {
          setAllowed(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAllowed(fallback);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canAccess, currentUserId, relation, object, fallback]);

  return allowed;
}

/**
 * Hook for batch permission checks
 * @param checks - Array of [relation, object] tuples
 */
export function usePermissionCheck(
  checks: Array<[string, string]>
): boolean[] {
  const { canAccessBatch, currentUserId } = usePermissions();
  const [results, setResults] = useState<boolean[]>(
    checks.map(() => false)
  );

  useEffect(() => {
    if (!currentUserId || checks.length === 0) {
      setResults(checks.map(() => false));
      return;
    }

    let cancelled = false;

    canAccessBatch(checks)
      .then((batchResults) => {
        if (!cancelled) {
          setResults(batchResults);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResults(checks.map(() => false));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [canAccessBatch, currentUserId, checks]);

  return results;
}

