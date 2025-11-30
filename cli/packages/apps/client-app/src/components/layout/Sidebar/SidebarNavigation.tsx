import { Stack } from "@/components/ui/stack";
import { type SidebarItem, SidebarItemComponent } from "./SidebarItem";

export type { SidebarItem };

interface SidebarNavigationProps {
  items: SidebarItem[];
  isCollapsed: boolean;
  expandedItems: Set<string>;
  onToggleExpand: (path: string) => void;
  onNavAction?: (actionId: string, navPath: string) => void;
}

export function SidebarNavigation({
  items,
  isCollapsed,
  expandedItems,
  onToggleExpand,
  onNavAction,
}: SidebarNavigationProps) {
  return (
    <nav
      className="flex-1 overflow-y-auto p-2"
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      <Stack spacing="xs">
        {items.map((item) => (
          <SidebarItemComponent
            key={item.path}
            item={item}
            isCollapsed={isCollapsed}
            isExpanded={expandedItems.has(item.path)}
            onToggleExpand={() => onToggleExpand(item.path)}
            onNavAction={onNavAction}
          />
        ))}
      </Stack>
    </nav>
  );
}
