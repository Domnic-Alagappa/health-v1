import { Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

export function RootComponent() {
  return (
    <>
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  );
}
