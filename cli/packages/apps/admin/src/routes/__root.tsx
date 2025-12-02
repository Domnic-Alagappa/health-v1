import { getSetupStatus } from "@/lib/api/setup";
import { useAuthStore } from "@/stores/authStore";
import {
  Outlet,
  createRootRoute,
  redirect,
  useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Sidebar } from "../components/navigation/Sidebar";

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    // Public routes that don't require authentication or setup
    const publicRoutes = ["/login"];
    const isPublicRoute = publicRoutes.includes(location.pathname);

    // Check setup status first (before authentication check)
    try {
      const setupStatus = await getSetupStatus();
      // If setup is not completed, we still allow access to login for initial setup
      // The setup can be done after login or via a separate setup flow
      if (!setupStatus.setup_completed && !isPublicRoute) {
        // For now, allow access - setup can be handled post-login
        // You may want to redirect to a setup page if needed
      }
    } catch (err) {
      // If it's a redirect, re-throw it
      if (err && typeof err === "object" && "to" in err) {
        throw err;
      }
      // If API is not available, allow access (for development)
      console.warn("Could not check setup status:", err);
    }

    if (isPublicRoute) {
      return;
    }

    // Check authentication
    const authStore = useAuthStore.getState();

    // If no token in store, try to restore from sessionStorage
    if (!authStore.accessToken) {
      await authStore.checkAuth();
    }

    // If still not authenticated, redirect to login
    if (!authStore.isAuthenticated) {
      const redirectTo = location.pathname !== "/" ? location.pathname : undefined;
      throw redirect({
        to: "/login",
        search: redirectTo ? { redirect: redirectTo } : undefined,
      });
    }
  },
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  // Check if we're on the login page
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      <div className="min-h-screen bg-background flex">
        {!isLoginPage && <Sidebar />}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
      <TanStackRouterDevtools />
    </>
  );
}
