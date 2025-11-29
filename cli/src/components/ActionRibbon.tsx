import { memo, useMemo } from "react"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { Separator } from "@/components/ui/separator"
import { getTabActions } from "@/lib/tab-actions"
import { useActiveTabId, useTabs } from "@/stores/tabStore"

interface ActionRibbonProps {
  onAction?: (actionId: string, tabPath: string) => void
}

export const ActionRibbon = memo(function ActionRibbon({ onAction }: ActionRibbonProps) {
  const tabs = useTabs()
  const activeTabId = useActiveTabId()

  const activeTab = useMemo(() => tabs.find((t) => t.id === activeTabId), [tabs, activeTabId])

  const allActions = useMemo(() => {
    if (!activeTab) return []

    // Get all action groups from tab actions
    const actionGroups = getTabActions(activeTab.path, activeTab.label, onAction || (() => {}))

    // Flatten all actions from all groups into a single array
    return actionGroups.flatMap((group) => group.actions)
  }, [activeTab, onAction])

  // Don't show ribbon for dashboard or if no actions
  if (!activeTab || activeTab.path === "/" || allActions.length === 0) {
    return null
  }

  return (
    <Box className="border-b bg-card" role="toolbar" aria-label="Page actions">
      <Box className="px-4 py-2">
        <Flex className="items-center gap-1 flex-wrap" role="group">
          {allActions.map((action, index) => (
            <Flex key={action.id} className="items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => action.onClick()}
                disabled={action.disabled}
                className="h-8 text-xs"
                aria-label={action.label}
              >
                {action.icon && (
                  <span className="mr-1.5 h-3.5 w-3.5 shrink-0" aria-hidden="true">
                    {action.icon}
                  </span>
                )}
                <span>{action.label}</span>
              </Button>
              {index < allActions.length - 1 && (
                <Separator orientation="vertical" className="h-4" />
              )}
            </Flex>
          ))}
        </Flex>
      </Box>
    </Box>
  )
})
