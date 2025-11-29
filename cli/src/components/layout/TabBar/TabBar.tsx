import { Menu } from "lucide-react"
import { memo, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useNavigate } from "@tanstack/react-router"
import { useTabs, useActiveTabId, useSetActiveTab, useCloseTab } from "@/stores/tabStore"
import { cn } from "@/lib/utils"
import { TabItem } from "./TabItem"
import { TabUserMenu } from "./TabUserMenu"
import { TabDragPreview } from "./TabDragPreview"
import { useTabBarDrag } from "@/hooks/ui/useTabBarDrag"

interface TabBarProps {
  onMobileMenuClick?: () => void
}

const DASHBOARD_ID = "dashboard"

export const TabBar = memo(function TabBar({ onMobileMenuClick }: TabBarProps) {
  const navigate = useNavigate()
  const tabs = useTabs()
  const activeTabId = useActiveTabId()
  const setActiveTab = useSetActiveTab()
  const closeTab = useCloseTab()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)

  // Optimized tab sorting: Dashboard always first, all others in reverse order (newest first)
  // Uses efficient single-pass algorithm
  const sortedTabs = useMemo(() => {
    if (tabs.length === 0) return []

    // Single pass to separate dashboard and other tabs
    let dashboard: (typeof tabs)[0] | undefined
    const otherTabs: typeof tabs = []

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i]
      if (!tab) continue
      if (tab.path === "/" || tab.id === DASHBOARD_ID) {
        dashboard = tab
      } else {
        otherTabs.push(tab)
      }
    }

    // Reverse other tabs in-place for efficiency (newest first)
    for (let i = 0, j = otherTabs.length - 1; i < j; i++, j--) {
      const temp = otherTabs[i]
      if (temp && otherTabs[j]) {
        otherTabs[i] = otherTabs[j]!
        otherTabs[j] = temp
      }
    }

    return dashboard ? [dashboard, ...otherTabs] : otherTabs
  }, [tabs])

  const {
    draggedTabId,
    dragOverIndex,
    dragPosition,
    isDraggingOutside,
    dragOffsetRef,
    handleDragStart,
  } = useTabBarDrag({
    sortedTabs,
    scrollContainerRef,
    tabBarRef,
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }
  }, [])

  return (
    <TooltipProvider delayDuration={200}>
      <Box
        ref={tabBarRef}
        className="border-b border-[#E1E4E8] bg-[#F4F6F8] dark:bg-[#1E1E1E] dark:border-[#2B2B2B] relative flex items-center justify-between"
      >
        {/* Mobile Menu Button */}
        {onMobileMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 lg:hidden"
            onClick={onMobileMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

        {/* Scrollable tabs area - always show dashboard */}
        <Flex
          ref={scrollContainerRef}
          className="items-center gap-1 px-2 py-1 overflow-x-auto scrollbar-hide flex-1 min-w-0"
        >
          {sortedTabs.map((tab) => {
            if (!tab) return null
            const isDashboard = tab.id === DASHBOARD_ID || tab.path === "/"
            const isDragging = draggedTabId === tab.id

            // Calculate actual non-dashboard index for this tab
            let nonDashboardIndex = -1
            if (!isDashboard) {
              const nonDashboardTabs = sortedTabs.filter((t) => t && t.id !== DASHBOARD_ID)
              nonDashboardIndex = nonDashboardTabs.findIndex((t) => t && t.id === tab.id)
            }

            // Show placeholder space before this tab if dragOverIndex matches
            const showPlaceholderBefore =
              dragOverIndex !== null && !isDashboard && dragOverIndex === nonDashboardIndex

            return (
              <Box key={tab.id} className="relative">
                {/* Chrome-style placeholder: empty space where tab will be inserted */}
                {showPlaceholderBefore && !isDragging && (
                  <Box
                    className="absolute left-0 top-0 bottom-0 w-[180px] bg-primary/10 border-2 border-dashed border-primary rounded transition-all duration-200 z-10 h-[42px]"
                    style={{
                      animation: "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                )}
                {/* Hide the tab if it's being dragged */}
                {!isDragging && (
                  <TabItem
                    tab={tab}
                    isActive={tab.id === activeTabId}
                    isDragging={false}
                    isDragOver={false}
                    onSelect={() => setActiveTab(tab.id, (path) => navigate({ to: path as "/" | (string & {}) }))}
                    onClose={() => closeTab(tab.id, (path) => navigate({ to: path as "/" | (string & {}) }))}
                    onDragStart={(e) => handleDragStart(e, tab.id)}
                  />
                )}
                {/* Show invisible placeholder when dragging to maintain layout */}
                {isDragging && (
                  <Box className="invisible w-[180px] shrink-0 h-[42px]">
                    <Flex className="items-center gap-2 px-4 py-2 h-full">
                      {tab.icon && <span className="h-[18px] w-[18px] shrink-0">{tab.icon}</span>}
                      <span className="text-[14px] font-medium tracking-[0.25px] truncate flex-1">{tab.label}</span>
                    </Flex>
                  </Box>
                )}
              </Box>
            )
          })}
          {/* Show placeholder at the end if dragging to last position */}
          {dragOverIndex !== null &&
            (() => {
              const nonDashboardCount = sortedTabs.filter((t) => t && t.id !== DASHBOARD_ID).length
              return (
                dragOverIndex === nonDashboardCount &&
                draggedTabId && (
                  <Box
                    className="w-[180px] h-[42px] bg-primary/10 border-2 border-dashed border-primary rounded shrink-0 transition-all duration-200"
                    style={{
                      animation: "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                )
              )
            })()}
        </Flex>

        {/* Drag Preview - Floating tab name */}
        {draggedTabId &&
          dragPosition &&
          (() => {
            const draggedTab = sortedTabs.find((t) => t && t.id === draggedTabId)
            if (!draggedTab) return null

            return (
              <TabDragPreview
                draggedTab={draggedTab}
                dragPosition={dragPosition}
                dragOffset={dragOffsetRef.current}
                isDraggingOutside={isDraggingOutside}
              />
            )
          })()}

        {/* Fixed User Menu & Avatar at End - Always visible */}
        <TabUserMenu />
      </Box>
    </TooltipProvider>
  )
})

