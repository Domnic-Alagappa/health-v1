import { Box } from "@/components/ui/box";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Stack } from "@/components/ui/stack";
import { getNavActions, getNavContextActions } from "@/lib/nav-actions";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { memo } from "react";

export interface SidebarItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
}

interface SidebarItemProps {
  item: SidebarItem;
  isCollapsed: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onNavAction?: (actionId: string, navPath: string) => void;
}

export const SidebarItemComponent = memo(function SidebarItemComponent({
  item,
  isCollapsed,
  isExpanded,
  onToggleExpand,
  onNavAction,
}: SidebarItemProps) {
  const actions = getNavActions(item.path, onNavAction || (() => {}));
  const contextActions = getNavContextActions(item.path, onNavAction || (() => {}));
  const hasActions = actions.length > 0;

  const handleClick = () => {
    // Only toggle expand/collapse of actions, don't navigate
    if (hasActions && !isCollapsed) {
      onToggleExpand();
    } else if (isCollapsed) {
      // If collapsed and no actions, just navigate
      item.onClick();
    }
    // Otherwise, do nothing (just show/hide actions)
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Box>
          <button
            type="button"
            onClick={handleClick}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
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
            <Box className="mt-1 mb-2 border-t border-muted pt-2">
              <Stack spacing="xs">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // First navigate if needed, then execute action
                      if (!item.isActive) {
                        item.onClick();
                      }
                      action.onClick();
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
              </Stack>
            </Box>
          )}
        </Box>
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
  );
});
