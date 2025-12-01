import { Outlet, useLocation } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Sidebar } from "../components/navigation/Sidebar";

export function RootComponent() {
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
