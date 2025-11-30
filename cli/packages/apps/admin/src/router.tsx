import { createRouter, createRootRoute, createRoute } from "@tanstack/react-router"
import { RootComponent } from "./routes/__root"
import { DashboardPage } from "./routes/dashboard"
import { LoginPage } from "./routes/login"
import { OrganizationsPage } from "./routes/organizations"
import { UsersPage } from "./routes/users"
import { PermissionsPage } from "./routes/permissions"
import { ServicesPage } from "./routes/services"

// Root route
const rootRoute = createRootRoute({
  component: RootComponent,
})

// Login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
})

// Dashboard route
const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardPage,
})

// Organizations route
const organizationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/organizations",
  component: OrganizationsPage,
})

// Users route
const usersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/users",
  component: UsersPage,
})

// Permissions route
const permissionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/permissions",
  component: PermissionsPage,
})

// Services route
const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services",
  component: ServicesPage,
})

// Route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  dashboardRoute,
  organizationsRoute,
  usersRoute,
  permissionsRoute,
  servicesRoute,
])

// Create router
export const router = createRouter({ routeTree })

// Register router for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
