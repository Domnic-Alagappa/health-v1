/**
 * Route Layout Configuration
 * Maps routes to their appropriate layouts
 */

export type LayoutType = "full" | "minimal" | "clean" | "centered"

/**
 * Route to layout mapping
 * Routes can specify which layout they should use
 */
export const ROUTE_LAYOUTS: Record<string, LayoutType> = {
  // Public/auth routes - clean or centered
  "/login": "centered",
  "/access-denied": "clean",
  "/register": "centered",
  "/forgot-password": "centered",
  "/reset-password": "centered",

  // Main app routes - full layout
  "/": "full",
  "/patients": "full",
  "/clinical": "full",
  "/orders": "full",
  "/results": "full",
  "/scheduling": "full",
  "/pharmacy": "full",
  "/revenue": "full",
  "/analytics": "full",
  "/settings": "full",

  // Focused work routes - minimal layout (no sidebar)
  "/form-builder": "minimal",
  "/editor": "minimal",
  "/viewer": "minimal",
}

/**
 * Get layout type for a route
 */
export function getLayoutForRoute(pathname: string): LayoutType {
  // Check exact match first
  if (ROUTE_LAYOUTS[pathname]) {
    return ROUTE_LAYOUTS[pathname]
  }

  // Check pattern matches (e.g., /patients/:id)
  for (const [pattern, layout] of Object.entries(ROUTE_LAYOUTS)) {
    if (pattern.includes(":")) {
      // Convert pattern to regex
      const regex = new RegExp("^" + pattern.replace(/:[^/]+/g, "[^/]+") + "$")
      if (regex.test(pathname)) {
        return layout
      }
    }
  }

  // Default to full layout for authenticated routes
  return "full"
}

/**
 * Check if route should use a specific layout
 */
export function shouldUseLayout(pathname: string, layout: LayoutType): boolean {
  return getLayoutForRoute(pathname) === layout
}
