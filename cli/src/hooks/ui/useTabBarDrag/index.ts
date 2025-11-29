import { useEffect, useRef, useState } from "react"
import { useCloseTab, useReorderTabs } from "@/stores/tabStore"
import { createMouseHandlers } from "./mouseHandlers"

const DASHBOARD_ID = "dashboard"

interface UseTabBarDragOptions {
  sortedTabs: Array<{ id: string; label: string; path: string; closable?: boolean; allowDuplicate?: boolean } | undefined>
  scrollContainerRef: React.RefObject<HTMLDivElement>
  tabBarRef: React.RefObject<HTMLDivElement>
}

export function useTabBarDrag({ sortedTabs, scrollContainerRef, tabBarRef }: UseTabBarDragOptions) {
  const closeTab = useCloseTab()
  const reorderTabs = useReorderTabs()
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDraggingOutside, setIsDraggingOutside] = useState(false)
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const draggedTabIdRef = useRef<string | null>(null)
  const dragOverIndexRef = useRef<number | null>(null)
  const sortedTabsRef = useRef<typeof sortedTabs>([])
  const isOutsideRef = useRef(false)

  // Update refs when state changes
  useEffect(() => {
    draggedTabIdRef.current = draggedTabId
  }, [draggedTabId])

  useEffect(() => {
    dragOverIndexRef.current = dragOverIndex
  }, [dragOverIndex])

  useEffect(() => {
    sortedTabsRef.current = sortedTabs
  }, [sortedTabs])

  const handleDragStart = (e: React.MouseEvent | MouseEvent, tabId: string) => {
    // Dashboard cannot be dragged
    if (tabId === DASHBOARD_ID) {
      return
    }

    const tab = sortedTabs.find((t) => t && t.id === tabId)
    if (!tab || (!tab.closable && tab.path === "/")) {
      return
    }

    draggedTabIdRef.current = tabId
    setDraggedTabId(tabId)

    // Initialize drag over index to current position
    const nonDashboardTabs = sortedTabsRef.current.filter((t) => t && t.id !== DASHBOARD_ID)
    const currentIndex = nonDashboardTabs.findIndex((t) => t && t.id === tabId)
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

    const { handleMouseMove, handleMouseUp } = createMouseHandlers({
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
    })

    const cleanup = (e?: MouseEvent) => {
      const result = handleMouseUp(e)
      draggedTabIdRef.current = null
      dragOverIndexRef.current = null
      isOutsideRef.current = false
      setDraggedTabId(result.draggedTabId)
      setDragOverIndex(result.dragOverIndex)
      setDragPosition(result.dragPosition)
      setIsDraggingOutside(result.isDraggingOutside)
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", cleanup)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", cleanup)
  }

  return {
    draggedTabId,
    dragOverIndex,
    dragPosition,
    isDraggingOutside,
    dragOffsetRef,
    handleDragStart,
  }
}

