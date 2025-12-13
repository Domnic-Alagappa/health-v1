import { RouterProvider, createRoute, createRouter } from '@tanstack/react-router';
import { Route as rootRoute } from './routes/__root';
import { LoginPage } from './routes/login';
import { DashboardPage } from './routes/index';
import { SecretsPage } from './routes/secrets';
import { RealmsPage } from './routes/realms';
import { SystemPage } from './routes/system';
import { PoliciesPage } from './routes/policies';
import { TokensPage } from './routes/tokens';
import { UsersPage } from './routes/users';

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

// Dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: DashboardPage,
});

// Secrets route
const secretsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/secrets',
  component: SecretsPage,
});

// Policies route
const policiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/policies',
  component: PoliciesPage,
});

// Tokens route
const tokensRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tokens',
  component: TokensPage,
});

// Users route
const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/users',
  component: UsersPage,
});

// Realms route
const realmsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/realms',
  component: RealmsPage,
});

// System route
const systemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/system',
  component: SystemPage,
});

// Route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  secretsRoute,
  policiesRoute,
  tokensRoute,
  usersRoute,
  realmsRoute,
  systemRoute,
]);

// Create router
export const router = createRouter({ routeTree });

// Register router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Router component
export default function Router() {
  return <RouterProvider router={router} />;
}

