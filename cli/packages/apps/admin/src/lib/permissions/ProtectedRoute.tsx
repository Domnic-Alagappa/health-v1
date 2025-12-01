/**
 * Protected Route Component
 * Wraps TanStack Router routes to check page access before rendering
 */

import { Navigate } from "@tanstack/react-router";
import { useCanAccess } from "./context";

interface ProtectedRouteProps {
  children: React.ReactNode;
  pageName: string; // e.g., "users", "organizations"
  relation?: string; // Default: "can_view"
  fallbackPath?: string; // Default: "/"
}

/**
 * Protected Route - checks page access before rendering
 */
export function ProtectedRoute({
  children,
  pageName,
  relation = "can_view",
  fallbackPath = "/",
}: ProtectedRouteProps) {
  const object = `page:${pageName}`;
  const canAccess = useCanAccess(relation, object, false);

  if (!canAccess) {
    return <Navigate to={fallbackPath} />;
  }

  return <>{children}</>;
}

/**
 * Higher-order component to protect a route
 */
export function withProtectedRoute<T extends object>(
  Component: React.ComponentType<T>,
  pageName: string,
  relation?: string,
  fallbackPath?: string
) {
  return function ProtectedComponent(props: T) {
    return (
      <ProtectedRoute
        pageName={pageName}
        relation={relation}
        fallbackPath={fallbackPath}
      >
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

