import { useEffect, useState } from "react"
import type {
  CanvasField,
  CanvasFormConfig,
  CanvasGroup,
  CanvasSection,
} from "@/components/forms/canvas/types"
import { createDragHandlers } from "./handlers"
import { handleMouseMove } from "./move"

interface UseCanvasDragOptions {
  fields: CanvasField[]
  groups: CanvasGroup[]
  sections: CanvasSection[]
  canvasConfig: CanvasFormConfig
  canvasRef: React.RefObject<HTMLDivElement>
  snapToGrid: boolean
  gridSize: number
  wrapOverflow: boolean
  updateField: (fieldId: string, updates: Partial<CanvasField>) => void
  setGroups: React.Dispatch<React.SetStateAction<CanvasGroup[]>>
  setSections: React.Dispatch<React.SetStateAction<CanvasSection[]>>
}

export function useCanvasDrag({
  fields,
  groups,
  sections,
  canvasConfig,
  canvasRef,
  snapToGrid,
  gridSize,
  wrapOverflow,
  updateField,
  setGroups,
  setSections,
}: UseCanvasDragOptions) {
  const [draggedField, setDraggedField] = useState<string | null>(null)
  const [draggedGroup, setDraggedGroup] = useState<string | null>(null)
  const [draggedSection, setDraggedSection] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMoveEvent = (e: MouseEvent) => {
      handleMouseMove(e, {
        draggedField,
        draggedGroup,
        draggedSection,
        fields,
        groups,
        sections,
        canvasConfig,
        canvasRef,
        dragOffset,
        snapToGrid,
        gridSize,
        wrapOverflow,
        updateField,
        setGroups,
        setSections,
      })
    }

    const handleMouseUp = () => {
      setDraggedField(null)
      setDraggedGroup(null)
      setDraggedSection(null)
    }

    if (draggedField || draggedGroup || draggedSection) {
      document.addEventListener("mousemove", handleMouseMoveEvent)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMoveEvent)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [
    draggedField,
    draggedGroup,
    draggedSection,
    dragOffset,
    wrapOverflow,
    canvasConfig,
    fields,
    groups,
    sections,
    snapToGrid,
    gridSize,
    canvasRef,
    updateField,
    setGroups,
    setSections,
  ])

  const { handleFieldDragStart, handleGroupDragStart, handleSectionDragStart } = createDragHandlers(
    {
      fields,
      groups,
      sections,
      canvasRef,
      setDraggedField,
      setDraggedGroup,
      setDraggedSection,
      setDragOffset,
    }
  )

  return {
    draggedField,
    draggedGroup,
    draggedSection,
    handleFieldDragStart,
    handleGroupDragStart,
    handleSectionDragStart,
  }
}
