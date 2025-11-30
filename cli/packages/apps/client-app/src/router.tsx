import { RouterProvider, createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Expose router globally for programmatic navigation (e.g., voice commands)
if (typeof window !== "undefined") {
  (window as any).__tanstackRouter = router;
}

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

function Router() {
  return <RouterProvider router={router} />;
}

export default Router;
export { router };
