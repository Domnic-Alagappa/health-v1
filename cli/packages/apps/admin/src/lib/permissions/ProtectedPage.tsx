/**
 * Protected Page Component
 * Wraps page content to check access before rendering
 */

import { useCanAccess } from "./context";

interface ProtectedPageProps {
  children: React.ReactNode;
  pageName: string; // e.g., "users", "organizations"
  relation?: string; // Default: "can_view"
  fallback?: React.ReactNode; // What to show if no access
}

/**
 * Protected Page - checks page access before rendering content
 */
export function ProtectedPage({
  children,
  pageName,
  relation = "can_view",
  fallback = null,
}: ProtectedPageProps) {
  const object = `page:${pageName}`;
  const canAccess = useCanAccess(relation, object, false);

  if (!canAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

