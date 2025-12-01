/**
 * Navigation Sidebar Component
 * Permission-aware navigation that filters items based on user permissions
 */

import { Link, useLocation } from "@tanstack/react-router";
import { useCanAccess } from "../../lib/permissions";
import {
  LayoutDashboard,
  Users,
  Building2,
  Shield,
  UserCog,
  UsersRound,
  FileText,
  Key,
  Settings,
  Network,
} from "lucide-react";
import { cn } from "@health-v1/ui-components";

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string; // Zanzibar resource for permission check
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    permission: "page:dashboard",
  },
  {
    name: "Users",
    path: "/users",
    icon: Users,
    permission: "page:users",
  },
  {
    name: "Organizations",
    path: "/organizations",
    icon: Building2,
    permission: "page:organizations",
  },
  {
    name: "Permissions",
    path: "/permissions",
    icon: Shield,
    permission: "page:permissions",
  },
  {
    name: "Zanzibar Relationships",
    path: "/zanzibar-relationships",
    icon: Network,
    permission: "page:permissions",
  },
  {
    name: "Roles",
    path: "/roles",
    icon: UserCog,
    permission: "page:roles",
  },
  {
    name: "Groups",
    path: "/groups",
    icon: UsersRound,
    permission: "page:groups",
  },
  {
    name: "UI Entities",
    path: "/ui-entities",
    icon: FileText,
    permission: "page:ui-entities",
  },
  {
    name: "Encryption",
    path: "/encryption",
    icon: Key,
    permission: "page:encryption",
    // This is a parent item, we'll handle sub-items separately
  },
  {
    name: "Services",
    path: "/services",
    icon: Settings,
    permission: "page:services",
  },
];

export function Sidebar() {
  const location = useLocation();
  
  // Check permissions for all nav items upfront
  const canViewDashboard = useCanAccess("can_view", "page:dashboard");
  const canViewUsers = useCanAccess("can_view", "page:users");
  const canViewOrganizations = useCanAccess("can_view", "page:organizations");
  const canViewPermissions = useCanAccess("can_view", "page:permissions");
  const canViewRoles = useCanAccess("can_view", "page:roles");
  const canViewGroups = useCanAccess("can_view", "page:groups");
  const canViewUiEntities = useCanAccess("can_view", "page:ui-entities");
  const canViewEncryption = useCanAccess("can_view", "page:encryption");
  const canViewServices = useCanAccess("can_view", "page:services");
  
  // Check permissions for encryption sub-items
  const canViewDeks = useCanAccess("can_view", "page:encryption-deks");
  const canViewMasterKey = useCanAccess("can_view", "page:encryption-master-key");

  // Permission map
  const permissionMap: Record<string, boolean> = {
    "page:dashboard": canViewDashboard,
    "page:users": canViewUsers,
    "page:organizations": canViewOrganizations,
    "page:permissions": canViewPermissions,
    "page:roles": canViewRoles,
    "page:groups": canViewGroups,
    "page:ui-entities": canViewUiEntities,
    "page:encryption": canViewEncryption,
    "page:services": canViewServices,
  };

  // Filter nav items based on permissions
  const visibleItems = navItems.filter((item) => {
    if (!item.permission) return true;
    return permissionMap[item.permission] ?? false;
  });

  return (
    <div className="w-64 border-r bg-background h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold">Admin Panel</h2>
      </div>
      <nav className="px-2 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
                          (item.path !== "/" && location.pathname.startsWith(item.path));
          
          // Special handling for encryption sub-items
          if (item.path === "/encryption") {
            return (
              <div key={item.path} className="space-y-1">
                <Link
                  to={item.path as any}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
                {/* Encryption sub-items */}
                {isActive && (
                  <div className="ml-6 space-y-1">
                    {canViewDeks && (
                      <Link
                        to="/encryption/deks"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                          location.pathname === "/encryption/deks"
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                        DEK Management
                      </Link>
                    )}
                    {canViewMasterKey && (
                      <Link
                        to="/encryption/master-key"
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                          location.pathname === "/encryption/master-key"
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <span className="w-2 h-2 rounded-full bg-current" />
                        Master Key
                      </Link>
                    )}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

