import { Outlet, createRootRoute, redirect, useLocation } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useAuthStore } from '@/stores/authStore';
import { Sidebar } from '@/components/navigation/Sidebar';

export const Route = createRootRoute({
  component: RootComponent,
  beforeLoad: async ({ location }) => {
    const publicRoutes = ['/login'];
    const isPublicRoute = publicRoutes.includes(location.pathname);

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
      const redirectTo = location.pathname !== '/' ? location.pathname : undefined;
      throw redirect({
        to: '/login',
        search: redirectTo ? { redirect: redirectTo } : undefined,
      });
    }
  },
});

function RootComponent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  return (
    <>
      <div className="min-h-screen bg-background flex">
        {!isLoginPage && <Sidebar />}
        <div className="flex-1">
          <Outlet />
        </div>
      </div>
    </>
  );
}

