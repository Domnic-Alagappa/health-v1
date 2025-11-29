import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Stethoscope } from "lucide-react"
import { memo, type ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { getNavActions, getNavContextActions } from "@/lib/nav-actions"
import { cn } from "@/lib/utils"

export interface SidebarItem {
  path: string
  label: string
  icon: ReactNode
  onClick: () => void
  isActive?: boolean
}

interface SidebarProps {
  isCollapsed: boolean
  onToggle: () => void
  items: SidebarItem[]
  onNavAction?: (actionId: string, navPath: string) => void
}

interface SidebarItemProps {
  item: SidebarItem
  isCollapsed: boolean
  isExpanded: boolean
  onToggleExpand: () => void
  onNavAction?: (actionId: string, navPath: string) => void
}

const SidebarItem = memo(function SidebarItem({
  item,
  isCollapsed,
  isExpanded,
  onToggleExpand,
  onNavAction,
}: SidebarItemProps) {
  const actions = getNavActions(item.path, onNavAction || (() => {}))
  const contextActions = getNavContextActions(item.path, onNavAction || (() => {}))
  const hasActions = actions.length > 0

  const handleClick = () => {
    // Only toggle expand/collapse of actions, don't navigate
    if (hasActions && !isCollapsed) {
      onToggleExpand()
    } else if (isCollapsed) {
      // If collapsed and no actions, just navigate
      item.onClick()
    }
    // Otherwise, do nothing (just show/hide actions)
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div>
          <button
            type="button"
            onClick={handleClick}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left",
              "hover:bg-accent hover:text-accent-foreground",
              item.isActive
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground"
            )}
            title={isCollapsed ? item.label : undefined}
          >
            <span className="h-5 w-5 shrink-0 flex items-center justify-center">{item.icon}</span>
            {!isCollapsed && (
              <>
                <span className="text-sm font-medium truncate flex-1">{item.label}</span>
                {hasActions && (
                  <span className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </span>
                )}
              </>
            )}
          </button>

          {/* Action Items Below Nav Item (like Excel ribbon) */}
          {!isCollapsed && isExpanded && hasActions && (
            <div className="mt-1 mb-2 space-y-0.5 border-t border-muted pt-2">
              {actions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    // First navigate if needed, then execute action
                    if (!item.isActive) {
                      item.onClick()
                    }
                    action.onClick()
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors text-left",
                    "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {action.icon && <span className="h-4 w-4 shrink-0">{action.icon}</span>}
                  <span className="text-xs font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {contextActions.map((action) => (
          <ContextMenuItem key={action.id} onClick={() => action.onClick()}>
            {action.label}
          </ContextMenuItem>
        ))}
        {hasActions && !isCollapsed && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onToggleExpand}>
              {isExpanded ? "Hide" : "Show"} Actions
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  )
})

export const Sidebar = memo(function Sidebar({
  isCollapsed,
  onToggle,
  items,
  onNavAction,
}: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpand = (path: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        // Auto-collapse other items (Excel-style: only one section open at a time)
        next.clear()
        next.add(path)
      }
      return next
    })
  }

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
    >
      {/* Header with Logo */}
      <div className="flex items-center justify-between p-4 border-b shrink-0">
        {isCollapsed ? (
          <div className="flex items-center justify-center w-full">
            <Stethoscope className="h-6 w-6 text-primary shrink-0" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <Stethoscope className="h-6 w-6 text-primary shrink-0" />
              <h2 className="text-lg font-semibold truncate">EHR Platform</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="shrink-0"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Collapse button when collapsed - positioned at bottom */}
      {isCollapsed && (
        <div className="p-2 border-t shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="w-full"
            title="Expand sidebar"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Navigation Items */}
      <nav
        className="flex-1 overflow-y-auto p-2 space-y-1"
        onContextMenu={(e) => {
          e.preventDefault()
        }}
      >
        {items.map((item) => (
          <SidebarItem
            key={item.path}
            item={item}
            isCollapsed={isCollapsed}
            isExpanded={expandedItems.has(item.path)}
            onToggleExpand={() => toggleExpand(item.path)}
            onNavAction={handleNavAction}
          />
        ))}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t shrink-0">
          <div className="text-xs text-muted-foreground text-center">HIPAA Compliant</div>
        </div>
      )}
    </aside>
  )
})
