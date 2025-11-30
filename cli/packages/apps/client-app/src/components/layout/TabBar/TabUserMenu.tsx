import { AccessibilityPanel } from "@/components/accessibility/AccessibilityPanel";
import { KeyboardShortcutsHelp } from "@/components/accessibility/KeyboardShortcutsHelp";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDisclosure } from "@/hooks/ui/useDisclosure";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useNavigate } from "@tanstack/react-router";
import { Accessibility, Keyboard, LogOut, MoreVertical, Settings, User } from "lucide-react";

export function TabUserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { onOpen: onOpenAccessibility } = useDisclosure("accessibility-panel");
  const { onOpen: onOpenKeyboardHelp } = useDisclosure("keyboard-shortcuts-help");

  const handleLogout = async () => {
    try {
      await logout();
      navigate({ to: "/login" });
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate to login even if logout API call fails
      navigate({ to: "/login" });
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.email) {
      return user.email
        .split("@")[0]
        .split(".")
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "U";
  };

  const displayName = user?.email?.split("@")[0] || "User";

  return (
    <div className={cn("flex items-center gap-2 px-2 py-1 bg-[#F4F6F8]")}>
      {/* User Menu Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-semibold">{displayName}</span>
              {user?.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
              {user?.role && <span className="text-xs text-muted-foreground">{user.role}</span>}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onOpenAccessibility}>
            <Accessibility className="mr-2 h-4 w-4" />
            Accessibility
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenKeyboardHelp}>
            <Keyboard className="mr-2 h-4 w-4" />
            Keyboard Shortcuts
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Avatar */}
      <Avatar className="h-7 w-7">
        <AvatarImage src={undefined} />
        <AvatarFallback>{getUserInitials()}</AvatarFallback>
      </Avatar>

      {/* Hidden dialogs that can be triggered from menu */}
      <AccessibilityPanel showTrigger={false} />
      <KeyboardShortcutsHelp showTrigger={false} />
    </div>
  );
}
