import { RouterProvider, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { RootComponent } from "./routes/__root";
import { DashboardPage } from "./routes/dashboard";
import { LoginPage } from "./routes/login";
import { OrganizationsPage } from "./routes/organizations";
import { PermissionsPage } from "./routes/permissions";
import { ServicesPage } from "./routes/services";
import { UsersPage } from "./routes/users";
import { RolesPage } from "./routes/roles";
import { GroupsPage } from "./routes/groups";

// Root route
const rootRoute = createRootRoute({
  component: RootComponent,
});

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
});

// Organizations route
const organizationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organizations",
  component: OrganizationsPage,
});

// Users route
const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: UsersPage,
});

// Permissions route
const permissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/permissions",
  component: PermissionsPage,
});

// Roles route
const rolesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/roles",
  component: RolesPage,
});

// Groups route
const groupsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/groups",
  component: GroupsPage,
});

// Services route
const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services",
  component: ServicesPage,
});

// Route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  organizationsRoute,
  usersRoute,
  permissionsRoute,
  rolesRoute,
  groupsRoute,
  servicesRoute,
]);

// Create router
export const router = createRouter({ routeTree });

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Router component
export default function Router() {
  return <RouterProvider router={router} />;
}
