import { useNavigate } from "@tanstack/react-router"
import { Accessibility, Keyboard, LogOut, MoreVertical, Settings, User } from "lucide-react"
import { AccessibilityPanel } from "@/components/accessibility/AccessibilityPanel"
import { KeyboardShortcutsHelp } from "@/components/accessibility/KeyboardShortcutsHelp"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDisclosure } from "@/hooks/ui/useDisclosure"
import { cn } from "@/lib/utils"

export function TabUserMenu() {
  const navigate = useNavigate()
  const { onOpen: onOpenAccessibility } = useDisclosure("accessibility-panel")
  const { onOpen: onOpenKeyboardHelp } = useDisclosure("keyboard-shortcuts-help")

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 bg-[#F4F6F8] dark:bg-[#1E1E1E] shrink-0 border-l border-[#E1E4E8] dark:border-[#2B2B2B]"
      )}
    >
      {/* User Menu Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Dr. John Doe, MD</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
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
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Avatar */}
      <Avatar className="h-7 w-7">
        <AvatarImage src="https://github.com/shadcn.png" />
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>

      {/* Hidden dialogs that can be triggered from menu */}
      <AccessibilityPanel showTrigger={false} />
      <KeyboardShortcutsHelp showTrigger={false} />
    </div>
  )
}
