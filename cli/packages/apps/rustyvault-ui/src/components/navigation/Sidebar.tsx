import { Link, useLocation } from '@tanstack/react-router';
import { LayoutDashboard, Lock, Globe, Settings, LogOut, Shield, Key, Users } from 'lucide-react';
import { cn } from '@health-v1/ui-components';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@health-v1/ui-components';

interface NavItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Secrets',
    path: '/secrets',
    icon: Lock,
    section: 'Secrets',
  },
  {
    name: 'Policies',
    path: '/policies',
    icon: Shield,
    section: 'Access Control',
  },
  {
    name: 'Tokens',
    path: '/tokens',
    icon: Key,
    section: 'Authentication',
  },
  {
    name: 'Users',
    path: '/users',
    icon: Users,
    section: 'Authentication',
  },
  {
    name: 'Realms',
    path: '/realms',
    icon: Globe,
    section: 'Multi-tenancy',
  },
  {
    name: 'System',
    path: '/system',
    icon: Settings,
    section: 'Administration',
  },
];

export function Sidebar() {
  const location = useLocation();
  const { logout } = useAuthStore();

  return (
    <div className="w-64 border-r bg-background h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">RustyVault</h2>
      </div>
      <nav className="px-2 py-4 space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => logout()}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}

