import { memo } from "react"
import { Box } from "@/components/ui/box"
import { Stack } from "@/components/ui/stack"
import { cn } from "@/lib/utils"
import { useSidebarExpandedItems, useToggleSidebarExpand } from "@/stores/uiStore"
import { SidebarCollapseButton } from "./SidebarCollapseButton"
import { SidebarFooter } from "./SidebarFooter"
import { SidebarHeader } from "./SidebarHeader"
import { type SidebarItem, SidebarNavigation } from "./SidebarNavigation"

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  items: SidebarItem[]
  onNavAction?: (actionId: string, navPath: string) => void
}

export const Sidebar = memo(function Sidebar({
  isCollapsed,
  onToggle,
  items,
  onNavAction,
}: SidebarProps) {
  const expandedItems = useSidebarExpandedItems()
  const toggleExpand = useToggleSidebarExpand()

  const handleNavAction = (actionId: string, navPath: string) => {
    if (onNavAction) {
      onNavAction(actionId, navPath)
    } else {
      console.log(`Nav action: ${actionId} for path: ${navPath}`)
    }
  }

  return (
    <aside
      className={cn(
        "h-screen bg-card border-r flex flex-col transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <SidebarHeader isCollapsed={isCollapsed} onToggle={onToggle} />

      {isCollapsed && <SidebarCollapseButton onToggle={onToggle} />}

      <SidebarNavigation
        items={items}
        isCollapsed={isCollapsed}
        expandedItems={expandedItems}
        onToggleExpand={toggleExpand}
        onNavAction={handleNavAction}
      />

      <SidebarFooter isCollapsed={isCollapsed} />
    </aside>
  )
})
