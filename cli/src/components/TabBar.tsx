import { GripVertical, LogOut, Menu, MoreVertical, Settings, User, X } from "lucide-react"
import { memo, useEffect, useMemo, useRef, useState } from "react"
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useTabs } from "@/contexts/TabContext"
import { openNewWindow } from "@/lib/tauriUtils"
import { cn } from "@/lib/utils"

interface TabItemProps {
  tab: { id: string; label: string; path: string; icon?: React.ReactNode; closable?: boolean; alert?: boolean; success?: boolean; disabled?: boolean }
  isActive: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onSelect: () => void
  onClose: () => void
  onDragStart: (e: React.MouseEvent) => void
}

// Module color mapping - Microsoft 365 style
const getModuleColor = (path: string): { color: string; className: string } => {
  if (path.includes('/patients') || path === '/') return { color: '#0066CC', className: 'text-primary' } // Patient Overview
  if (path.includes('/clinical')) return { color: '#2A7FA9', className: 'text-[#2A7FA9]' } // Clinical Charts
  if (path.includes('/results') || path.includes('/labs')) return { color: '#9C27B0', className: 'text-info' } // Labs & Results
  if (path.includes('/pharmacy') || path.includes('/care')) return { color: '#1E8D4C', className: 'text-accent' } // Care Plans
  if (path.includes('/scheduling') || path.includes('/messaging')) return { color: '#FFC900', className: 'text-[#FFC900]' } // Messaging
  if (path.includes('/orders') || path.includes('/alerts')) return { color: '#E84F24', className: 'text-warning' } // Alerts/Flags
  return { color: '#0066CC', className: 'text-primary' } // Default
}

interface TabBarProps {
  onMobileMenuClick?: () => void
}

const DASHBOARD_ID = "dashboard"

// Memoized tab item to prevent unnecessary re-renders
const TabItem = memo(function TabItem({
  tab,
  isActive,
  isDragging,
  isDragOver,
  onSelect,
  onClose,
  onDragStart,
}: TabItemProps) {
  const isDraggable = tab.closable && tab.id !== DASHBOARD_ID && tab.path !== "/"
  const tabRef = useRef<HTMLDivElement>(null)
  const mouseDownRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const isDraggingRef = useRef(false)

  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore if clicking the close button
    if ((e.target as HTMLElement).closest("button")) {
      return
    }

    if (!isDraggable) return

    const startEvent = e
    mouseDownRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    }
    isDraggingRef.current = false

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!mouseDownRef.current) return

      const deltaX = Math.abs(moveEvent.clientX - mouseDownRef.current.x)
      const deltaY = Math.abs(moveEvent.clientY - mouseDownRef.current.y)
      const threshold = 5 // pixels

      // If mouse moved more than threshold, start dragging
      if (deltaX > threshold || deltaY > threshold) {
        isDraggingRef.current = true
        // Pass the original mouse down event for proper offset calculation
        onDragStart(startEvent)
        mouseDownRef.current = null
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }

    const handleMouseUp = () => {
      // If we didn't drag, treat it as a click
      if (!isDraggingRef.current && mouseDownRef.current) {
        const timeDiff = Date.now() - mouseDownRef.current.time
        // Only select if it was a quick click (not a long press)
        if (timeDiff < 200) {
          onSelect()
        }
      }
      mouseDownRef.current = null
      isDraggingRef.current = false
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  return (
    <div
      ref={tabRef}
      role="button"
      tabIndex={0}
      className={cn(
        "flex items-center gap-1 shrink-0 relative transition-all duration-200",
        isDragging && "opacity-30 scale-95 transform-gpu",
        isDragOver && "border-l-2 border-primary animate-pulse"
      )}
      data-tab-id={tab.id}
      style={isDragging ? { cursor: "grabbing", zIndex: 1000 } : undefined}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          if (!isDraggable) {
            onSelect()
          }
        }
      }}
    >
      {isDraggable && (
        <div
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded opacity-60 hover:opacity-100 transition-opacity"
          title="Drag to reorder"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            role="button"
            tabIndex={0}
            className={cn(
              // Base styles - Microsoft Fluent UI tab design
              "group flex items-center gap-1.5 h-[42px] px-4 py-2 border-b-4 transition-fluent w-[180px] shrink-0",
              "text-[14px] font-medium tracking-[0.25px]",
              "rounded-t-sm", // 4px top corners only (Fluent UI)
              isDraggable && !isDragging && "cursor-grab active:cursor-grabbing",
              !isDraggable && !tab.disabled && "cursor-pointer",
              tab.disabled && "cursor-not-allowed opacity-60",
              
              // Default (Inactive) State - Fluent UI styling
              !isActive && !tab.disabled && !tab.alert && !tab.success && [
                "bg-[#F4F6F8] border-[#E1E4E8] text-[#4A4A4E]",
                "hover:bg-[#E9EEF3] hover:border-[#D0D6DB] hover:text-[#1C1C1E]",
                "dark:bg-[#1E1E1E] dark:text-[#A9A9A9] dark:border-transparent",
                "dark:hover:bg-[#2B2B2B] dark:hover:text-white"
              ],
              
              // Active State - Microsoft Fluent style with 4px bottom border
              isActive && !tab.alert && !tab.success && [
                "bg-white border-primary text-primary shadow-fluent-1",
                "dark:bg-[#2B2B2B] dark:border-primary dark:text-white"
              ],
              
              // Alert State
              tab.alert && [
                isActive 
                  ? "bg-[#FFF5F2] border-warning text-warning shadow-fluent-1 dark:bg-[#2B2B2B]"
                  : "bg-[#F4F6F8] border-transparent text-warning hover:bg-[#FFF5F2] hover:border-warning dark:bg-[#1E1E1E] dark:hover:bg-[#2B2B2B]"
              ],
              
              // Success State
              tab.success && [
                isActive
                  ? "bg-[#F0FAF4] border-accent text-accent shadow-fluent-1 dark:bg-[#2B2B2B]"
                  : "bg-[#F4F6F8] border-transparent text-accent hover:bg-[#F0FAF4] hover:border-accent dark:bg-[#1E1E1E] dark:hover:bg-[#2B2B2B]"
              ],
              
              // Disabled State
              tab.disabled && [
                "bg-[#F4F6F8] border-transparent text-[#A5A5A5]",
                "dark:bg-[#1E1E1E] dark:text-[#A5A5A5]"
              ]
            )}
            style={isActive && !tab.alert && !tab.success ? {
              borderBottomColor: getModuleColor(tab.path).color
            } : undefined}
            onMouseDown={isDraggable ? handleMouseDown : undefined}
            onClick={!isDraggable && !tab.disabled ? onSelect : undefined}
            onKeyDown={(e) => {
              if (!isDraggable && !tab.disabled && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault()
                onSelect()
              }
            }}
          >
            {tab.icon && (
              <span 
                className={cn(
                  "shrink-0 transition-colors",
                  !isActive && !tab.alert && !tab.success && "text-[#4A4A4E] dark:text-[#A9A9A9]",
                  tab.alert && "text-warning",
                  tab.success && "text-accent",
                  tab.disabled && "text-[#A5A5A5]"
                )}
                style={{ 
                  width: '18px', 
                  height: '18px',
                  ...(isActive && !tab.alert && !tab.success ? {
                    color: getModuleColor(tab.path).color
                  } : {})
                }}
              >
                {tab.icon}
              </span>
            )}
            <span className={cn(
              "truncate flex-1 capitalize",
              !isActive && !tab.alert && !tab.success && "text-[#4A4A4E] dark:text-[#A9A9A9]",
              tab.alert && "text-warning",
              tab.success && "text-accent",
              tab.disabled && "text-[#A5A5A5]"
            )}
            style={isActive && !tab.alert && !tab.success ? {
              color: getModuleColor(tab.path).color
            } : undefined}
            >
              {tab.label}
            </span>
            {tab.closable && !tab.disabled && (
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mr-1"
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tab.label}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  )
})

export const TabBar = memo(function TabBar({ onMobileMenuClick }: TabBarProps) {
  const { tabs, activeTabId, setActiveTab, closeTab, reorderTabs } = useTabs()
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDraggingOutside, setIsDraggingOutside] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const tabBarRef = useRef<HTMLDivElement>(null)
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const draggedTabIdRef = useRef<string | null>(null)
  const dragOverIndexRef = useRef<number | null>(null)
  const sortedTabsRef = useRef<typeof tabs>([])
  const isOutsideRef = useRef(false)

  // Optimized tab sorting: Dashboard always first, all others in reverse order (newest first)
  // Uses efficient single-pass algorithm
  const sortedTabs = useMemo(() => {
    if (tabs.length === 0) return []

    // Single pass to separate dashboard and other tabs
    let dashboard: (typeof tabs)[0] | undefined
    const otherTabs: typeof tabs = []

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i]
      if (tab.path === "/" || tab.id === DASHBOARD_ID) {
        dashboard = tab
      } else {
        otherTabs.push(tab)
      }
    }

    // Reverse other tabs in-place for efficiency (newest first)
    for (let i = 0, j = otherTabs.length - 1; i < j; i++, j--) {
      const temp = otherTabs[i]
      otherTabs[i] = otherTabs[j]
      otherTabs[j] = temp
    }

    const sorted = dashboard ? [dashboard, ...otherTabs] : otherTabs
    sortedTabsRef.current = sorted
    return sorted
  }, [tabs])

  // Update refs when state changes
  useEffect(() => {
    draggedTabIdRef.current = draggedTabId
  }, [draggedTabId])

  useEffect(() => {
    dragOverIndexRef.current = dragOverIndex
  }, [dragOverIndex])

  const handleDragStart = (e: React.MouseEvent | MouseEvent, tabId: string) => {
    // Dashboard cannot be dragged
    if (tabId === DASHBOARD_ID) {
      return
    }

    const tab = tabs.find((t) => t.id === tabId)
    if (!tab || (!tab.closable && tab.path === "/")) {
      return
    }

    draggedTabIdRef.current = tabId
    setDraggedTabId(tabId)

    // Initialize drag over index to current position
    const nonDashboardTabs = sortedTabsRef.current.filter((t) => t.id !== DASHBOARD_ID)
    const currentIndex = nonDashboardTabs.findIndex((t) => t.id === tabId)
    if (currentIndex >= 0) {
      dragOverIndexRef.current = currentIndex
      setDragOverIndex(currentIndex)
    }

    // Get the tab element to calculate offset
    const tabElement = scrollContainerRef.current?.querySelector(
      `[data-tab-id="${tabId}"]`
    ) as HTMLElement
    if (tabElement) {
      const rect = tabElement.getBoundingClientRect()
      const containerRect = scrollContainerRef.current?.getBoundingClientRect()
      if (containerRect) {
        dragOffsetRef.current = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }
        // Set initial drag position
        setDragPosition({
          x: e.clientX,
          y: e.clientY,
        })
      }
    }

    // Prevent text selection during drag
    document.body.style.userSelect = "none"
    document.body.style.cursor = "grabbing"

    // Add global mouse event listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedTabIdRef.current || !scrollContainerRef.current || !tabBarRef.current) return

      // Update drag position for preview animation
      setDragPosition({
        x: e.clientX,
        y: e.clientY,
      })

      // Check if dragging outside the tab bar area
      const tabBarRect = tabBarRef.current.getBoundingClientRect()
      const isOutside = !(
        e.clientX >= tabBarRect.left &&
        e.clientX <= tabBarRect.right &&
        e.clientY >= tabBarRect.top &&
        e.clientY <= tabBarRect.bottom
      )

      if (isOutside !== isOutsideRef.current) {
        isOutsideRef.current = isOutside
        setIsDraggingOutside(isOutside)
      }

      // If dragging outside, don't calculate insertion index
      if (isOutside) {
        dragOverIndexRef.current = null
        setDragOverIndex(null)
        return
      }

      const container = scrollContainerRef.current
      const containerRect = container.getBoundingClientRect()

      // Get all tab elements in DOM order (including dashboard)
      const allTabElements = Array.from(container.querySelectorAll<HTMLElement>("[data-tab-id]"))

      if (allTabElements.length === 0) return

      // Separate dashboard and non-dashboard tabs
      const dashboardElement = allTabElements.find(
        (el) => el.getAttribute("data-tab-id") === DASHBOARD_ID
      )
      const nonDashboardElements = allTabElements.filter(
        (el) => el.getAttribute("data-tab-id") !== DASHBOARD_ID
      )

      if (nonDashboardElements.length === 0) {
        dragOverIndexRef.current = 0
        setDragOverIndex(0)
        return
      }

      // Calculate mouse X position relative to container (accounting for scroll)
      const mouseX = e.clientX - containerRect.left + container.scrollLeft

      // Calculate dashboard width if it exists
      const dashboardWidth = dashboardElement
        ? dashboardElement.getBoundingClientRect().width + 4 // +4 for gap
        : 0

      // Adjust mouse X to account for dashboard (we only care about non-dashboard tabs)
      const adjustedMouseX = mouseX - dashboardWidth

      // Calculate target insertion index based on mouse position
      let targetIndex = nonDashboardElements.length // Default to end

      // Build a map of element -> actual tab index in sortedTabsRef
      // This ensures we use the correct index regardless of DOM order
      const elementToTabIndexMap = new Map<HTMLElement, number>()
      const nonDashboardTabs = sortedTabsRef.current.filter((t) => t.id !== DASHBOARD_ID)

      // Match each DOM element to its position in sorted tabs array
      nonDashboardElements.forEach((element) => {
        const tabId = element.getAttribute("data-tab-id")
        if (tabId) {
          const tabIndex = nonDashboardTabs.findIndex((t) => t.id === tabId)
          if (tabIndex >= 0) {
            elementToTabIndexMap.set(element, tabIndex)
          }
        }
      })

      // Find which tab the mouse is over or between
      for (let i = 0; i < nonDashboardElements.length; i++) {
        const element = nonDashboardElements[i]
        const rect = element.getBoundingClientRect()
        const relativeLeft = rect.left - containerRect.left + container.scrollLeft - dashboardWidth
        const relativeRight =
          rect.right - containerRect.left + container.scrollLeft - dashboardWidth
        const tabWidth = rect.width

        // Get the actual index of this tab in the sorted array
        const actualTabIndex = elementToTabIndexMap.get(element) ?? i

        // Check if mouse is over this tab
        if (adjustedMouseX >= relativeLeft && adjustedMouseX <= relativeRight) {
          // Determine if mouse is on left or right half
          const tabCenter = relativeLeft + tabWidth / 2

          if (adjustedMouseX < tabCenter) {
            // Insert before this tab
            targetIndex = actualTabIndex
          } else {
            // Insert after this tab
            targetIndex = actualTabIndex + 1
          }
          break
        } else if (adjustedMouseX < relativeLeft && i === 0) {
          // Mouse is before first tab
          targetIndex = actualTabIndex
          break
        } else if (i < nonDashboardElements.length - 1) {
          // Check if mouse is between this tab and the next
          const nextElement = nonDashboardElements[i + 1]
          const nextRect = nextElement.getBoundingClientRect()
          const nextRelativeLeft =
            nextRect.left - containerRect.left + container.scrollLeft - dashboardWidth

          if (adjustedMouseX > relativeRight && adjustedMouseX < nextRelativeLeft) {
            // Insert between current and next tab
            const nextActualIndex = elementToTabIndexMap.get(nextElement) ?? i + 1
            // Use the next tab's index as the insertion point
            targetIndex = nextActualIndex
            break
          }
        }
      }

      // Clamp to valid range
      targetIndex = Math.max(0, Math.min(targetIndex, nonDashboardElements.length))

      if (targetIndex !== dragOverIndexRef.current) {
        dragOverIndexRef.current = targetIndex
        setDragOverIndex(targetIndex)
      }
    }

    const handleMouseUp = (e?: MouseEvent) => {
      const currentDraggedTabId = draggedTabIdRef.current
      const currentDragOverIndex = dragOverIndexRef.current
      const wasOutside = isOutsideRef.current

      // If dropped outside the tab bar, create a standalone window
      if (currentDraggedTabId && wasOutside && e) {
        const draggedTab = sortedTabsRef.current.find((t) => t.id === currentDraggedTabId)
        if (draggedTab?.path) {
          // Generate a secure, one-time token for passing tab data
          // This avoids exposing sensitive data (like patient names in tab labels) in URLs
          const token = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`

          // Store tab info in sessionStorage with token as key (single-use, same-origin only)
          // sessionStorage is isolated per origin and cleared when tab closes
          const tabData = {
            label: draggedTab.label,
            path: draggedTab.path,
            closable: draggedTab.closable ?? true,
            allowDuplicate: draggedTab.allowDuplicate ?? false,
            timestamp: Date.now(), // For expiration check
          }

          try {
            sessionStorage.setItem(`_tab_${token}`, JSON.stringify(tabData))

            // Set expiration (5 minutes) - auto-cleanup old tokens
            sessionStorage.setItem(`_tab_${token}_expires`, String(Date.now() + 5 * 60 * 1000))

            // Create new window with only the token in URL (no sensitive data)
            const url = new URL(draggedTab.path, window.location.origin)
            url.searchParams.set("_tab", token)

            // Use Tauri-aware window opening utility
            openNewWindow(url.toString(), draggedTab.label, {
              width: 1200,
              height: 800,
              x: e.screenX - 100,
              y: e.screenY - 50,
            })
              .then((newWindow) => {
                // If window was successfully created
                if (newWindow) {
                  // Clean up token after window loads (with delay to ensure new window reads it)
                  setTimeout(() => {
                    try {
                      sessionStorage.removeItem(`_tab_${token}`)
                      sessionStorage.removeItem(`_tab_${token}_expires`)
                    } catch (_err) {
                      // Ignore cleanup errors
                    }
                  }, 2000)

                  // Close the tab from the original window
                  closeTab(currentDraggedTabId)
                } else {
                  // Window opening blocked - cleanup immediately
                  sessionStorage.removeItem(`_tab_${token}`)
                  sessionStorage.removeItem(`_tab_${token}_expires`)
                }
              })
              .catch((err) => {
                console.error("Error opening new window:", err)
                // Cleanup on error
                sessionStorage.removeItem(`_tab_${token}`)
                sessionStorage.removeItem(`_tab_${token}_expires`)
              })
          } catch (err) {
            console.error("Error creating standalone window:", err)
          }
        }
      } else if (
        currentDraggedTabId &&
        currentDragOverIndex !== null &&
        currentDragOverIndex !== undefined
      ) {
        // Normal reordering within the tab bar
        const nonDashboardTabs = sortedTabsRef.current.filter((t) => t.id !== DASHBOARD_ID)
        const currentIndex = nonDashboardTabs.findIndex((t) => t.id === currentDraggedTabId)

        // Only reorder if index actually changed
        if (currentIndex >= 0 && currentIndex !== currentDragOverIndex) {
          // Reorder tabs to the target position (dashboard stays first automatically)
          reorderTabs(currentDraggedTabId, currentDragOverIndex)
        }
      }

      draggedTabIdRef.current = null
      dragOverIndexRef.current = null
      isOutsideRef.current = false
      setDraggedTabId(null)
      setDragOverIndex(null)
      setDragPosition(null)
      setIsDraggingOutside(false)
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
    }
  }, [])

  return (
    <TooltipProvider delayDuration={200}>
      <div
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
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1 px-2 py-1 overflow-x-auto scrollbar-hide flex-1 min-w-0"
        >
          {sortedTabs.map((tab) => {
            const isDashboard = tab.id === DASHBOARD_ID || tab.path === "/"
            const isDragging = draggedTabId === tab.id

            // Calculate actual non-dashboard index for this tab
            let nonDashboardIndex = -1
            if (!isDashboard) {
              const nonDashboardTabs = sortedTabs.filter((t) => t.id !== DASHBOARD_ID)
              nonDashboardIndex = nonDashboardTabs.findIndex((t) => t.id === tab.id)
            }

            // Show placeholder space before this tab if dragOverIndex matches
            const showPlaceholderBefore =
              dragOverIndex !== null && !isDashboard && dragOverIndex === nonDashboardIndex

            return (
              <div key={tab.id} className="relative">
                {/* Chrome-style placeholder: empty space where tab will be inserted */}
                {showPlaceholderBefore && !isDragging && (
                  <div
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
                    onSelect={() => setActiveTab(tab.id)}
                    onClose={() => closeTab(tab.id)}
                    onDragStart={(e) => handleDragStart(e, tab.id)}
                  />
                )}
                {/* Show invisible placeholder when dragging to maintain layout */}
                {isDragging && (
                  <div className="invisible w-[180px] shrink-0 h-[42px]">
                    <div className="flex items-center gap-2 px-4 py-2 h-full">
                      {tab.icon && <span className="h-[18px] w-[18px] shrink-0">{tab.icon}</span>}
                      <span className="text-[14px] font-medium tracking-[0.25px] truncate flex-1">{tab.label}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {/* Show placeholder at the end if dragging to last position */}
          {dragOverIndex !== null &&
            (() => {
              const nonDashboardCount = sortedTabs.filter((t) => t.id !== DASHBOARD_ID).length
              return (
                dragOverIndex === nonDashboardCount &&
                draggedTabId && (
                  <div
                    className="w-[180px] h-[42px] bg-primary/10 border-2 border-dashed border-primary rounded shrink-0 transition-all duration-200"
                    style={{
                      animation: "pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                    }}
                  />
                )
              )
            })()}
        </div>

        {/* Drag Preview - Floating tab name */}
        {draggedTabId &&
          dragPosition &&
          (() => {
            const draggedTab = sortedTabs.find((t) => t.id === draggedTabId)
            if (!draggedTab) return null

            return (
              <div
                className="fixed pointer-events-none z-[9999] transition-none"
                style={{
                  left: `${dragPosition.x - dragOffsetRef.current.x}px`,
                  top: `${dragPosition.y - dragOffsetRef.current.y}px`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 shadow-lg",
                    "bg-white dark:bg-[#2B2B2B]",
                    "min-w-[140px] max-w-[220px]",
                    isDraggingOutside ? "border-accent" : "border-primary"
                  )}
                >
                  {draggedTab.icon && (
                    <span
                      className={cn(
                        "h-[18px] w-[18px] shrink-0",
                        isDraggingOutside ? "text-accent" : "text-primary"
                      )}
                    >
                      {draggedTab.icon}
                    </span>
                  )}
                  <span className="text-[14px] font-medium tracking-[0.25px] text-foreground truncate">
                    {draggedTab.label}
                  </span>
                  {isDraggingOutside && (
                    <span className="text-xs text-green-500 font-medium">(New Window)</span>
                  )}
                  <div
                    className={cn(
                      "absolute -inset-1 rounded-lg blur-sm -z-10 animate-pulse",
                      isDraggingOutside ? "bg-green-500/20" : "bg-primary/20"
                    )}
                  />
                </div>
              </div>
            )
          })()}

        {/* Fixed User Menu & Avatar at End - Always visible */}
        <div className={cn("flex items-center gap-2 px-2 py-1 bg-[#F4F6F8] dark:bg-[#1E1E1E] shrink-0 border-l border-[#E1E4E8] dark:border-[#2B2B2B]")}>
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
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
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
        </div>
      </div>
    </TooltipProvider>
  )
})
