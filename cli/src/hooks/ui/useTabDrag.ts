import { useRef } from "react"

interface UseTabDragOptions {
  isDraggable: boolean
  onDragStart: (e: React.MouseEvent) => void
  onSelect: () => void
}

export function useTabDrag({ isDraggable, onDragStart, onSelect }: UseTabDragOptions) {
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

  return { handleMouseDown }
}
