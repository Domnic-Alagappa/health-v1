import { memo, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTabs } from "@/contexts/TabContext"
import { getTabActions } from "@/lib/tab-actions"

interface ActionRibbonProps {
  onAction?: (actionId: string, tabPath: string) => void
}

export const ActionRibbon = memo(function ActionRibbon({ onAction }: ActionRibbonProps) {
  const { tabs, activeTabId } = useTabs()

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
    <div className="border-b bg-card">
      <div className="px-4 py-2">
        <div className="flex items-center gap-1 flex-wrap">
          {allActions.map((action, index) => (
            <div key={action.id} className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => action.onClick()}
                disabled={action.disabled}
                className="h-8 text-xs"
              >
                {action.icon && <span className="mr-1.5 h-3.5 w-3.5 shrink-0">{action.icon}</span>}
                <span>{action.label}</span>
              </Button>
              {index < allActions.length - 1 && (
                <Separator orientation="vertical" className="h-4" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})
