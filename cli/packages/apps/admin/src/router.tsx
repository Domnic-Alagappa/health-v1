import { RouterProvider, createRoute, createRouter } from "@tanstack/react-router";
import { Route as rootRoute } from "./routes/__root";
import { DashboardPage } from "./routes/dashboard";
import { LoginPage } from "./routes/login";
import { OrganizationsPage } from "./routes/organizations";
import { PermissionsPage } from "./routes/permissions";
import { ServicesPage } from "./routes/services";
import { UsersPage } from "./routes/users";
import { RolesPage } from "./routes/roles";
import { GroupsPage } from "./routes/groups";
import { UiEntitiesPage } from "./routes/ui-entities";
import { DekManagementPage } from "./routes/encryption/deks";
import { MasterKeyManagementPage } from "./routes/encryption/master-key";
import { EncryptionIndexPage } from "./routes/encryption/index";
import { ZanzibarRelationshipsPage } from "./routes/zanzibar-relationships";

// Root route (imported from __root.tsx which includes beforeLoad hook)

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

// UI Entities route
const uiEntitiesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/ui-entities",
  component: UiEntitiesPage,
});

// Encryption routes
const encryptionIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/encryption",
  component: EncryptionIndexPage,
});

const dekManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/encryption/deks",
  component: DekManagementPage,
});

const masterKeyManagementRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/encryption/master-key",
  component: MasterKeyManagementPage,
});

// Services route
const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services",
  component: ServicesPage,
});

// Zanzibar Relationships route
const zanzibarRelationshipsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/zanzibar-relationships",
  component: ZanzibarRelationshipsPage,
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
  uiEntitiesRoute,
  encryptionIndexRoute,
  dekManagementRoute,
  masterKeyManagementRoute,
  servicesRoute,
  zanzibarRelationshipsRoute,
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
