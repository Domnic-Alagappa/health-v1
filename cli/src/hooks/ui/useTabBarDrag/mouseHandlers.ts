import { calculateInsertionIndex } from "@/lib/tabDragUtils"
import { createStandaloneWindow } from "@/lib/tabWindowUtils"

interface MouseHandlersOptions {
  sortedTabsRef: React.RefObject<
    Array<
      | { id: string; label: string; path: string; closable?: boolean; allowDuplicate?: boolean }
      | undefined
    >
  >
  scrollContainerRef: React.RefObject<HTMLDivElement>
  tabBarRef: React.RefObject<HTMLDivElement>
  draggedTabIdRef: React.RefObject<string | null>
  dragOverIndexRef: React.RefObject<number | null>
  isOutsideRef: React.RefObject<boolean>
  setDragPosition: (pos: { x: number; y: number } | null) => void
  setIsDraggingOutside: (outside: boolean) => void
  setDragOverIndex: (index: number | null) => void
  closeTab: (tabId: string) => void
  reorderTabs: (tabId: string, newIndex: number) => void
}

export function createMouseHandlers(options: MouseHandlersOptions) {
  const {
    sortedTabsRef,
    scrollContainerRef,
    tabBarRef,
    draggedTabIdRef,
    dragOverIndexRef,
    isOutsideRef,
    setDragPosition,
    setIsDraggingOutside,
    setDragOverIndex,
    closeTab,
    reorderTabs,
  } = options

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

    // Calculate insertion index using utility function
    const targetIndex = calculateInsertionIndex({
      e,
      scrollContainerRef,
      sortedTabsRef,
    })

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
      const draggedTab = sortedTabsRef.current.find((t) => t && t.id === currentDraggedTabId)
      if (draggedTab) {
        createStandaloneWindow({
          draggedTab,
          e,
          onClose: closeTab,
        }).catch((err) => {
          console.error("Error creating standalone window:", err)
        })
      }
    } else if (
      currentDraggedTabId &&
      currentDragOverIndex !== null &&
      currentDragOverIndex !== undefined
    ) {
      // Normal reordering within the tab bar
      const nonDashboardTabs = sortedTabsRef.current.filter((t) => t && t.id !== "dashboard")
      const currentIndex = nonDashboardTabs.findIndex((t) => t && t.id === currentDraggedTabId)

      // Only reorder if index actually changed
      if (currentIndex >= 0 && currentIndex !== currentDragOverIndex) {
        // Reorder tabs to the target position (dashboard stays first automatically)
        reorderTabs(currentDraggedTabId, currentDragOverIndex)
      }
    }

    return {
      draggedTabId: null,
      dragOverIndex: null,
      dragPosition: null,
      isDraggingOutside: false,
    }
  }

  return {
    handleMouseMove,
    handleMouseUp,
  }
}
