import { useEffect, useState } from "react"
import type { CanvasField, CanvasFormConfig, CanvasGroup } from "@/components/forms/canvas/types"

interface UseCanvasResizeOptions {
  fields: CanvasField[]
  groups: CanvasGroup[]
  canvasRef: React.RefObject<HTMLDivElement>
  snapToGrid: boolean
  gridSize: number
  updateField: (fieldId: string, updates: Partial<CanvasField>) => void
  setGroups: React.Dispatch<React.SetStateAction<CanvasGroup[]>>
}

export function useCanvasResize({
  fields,
  groups,
  canvasRef,
  snapToGrid,
  gridSize,
  updateField,
  setGroups,
}: UseCanvasResizeOptions) {
  const [resizingField, setResizingField] = useState<string | null>(null)
  const [resizingGroup, setResizingGroup] = useState<string | null>(null)
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 })

  const snap = (value: number) => {
    if (!snapToGrid) return value
    return Math.round(value / gridSize) * gridSize
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingField || !canvasRef.current) return

      const field = fields.find((f) => f.id === resizingField)
      if (!field) return

      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      updateField(resizingField, {
        width: Math.max(50, snap(resizeStart.width + deltaX)),
        height: Math.max(20, snap(resizeStart.height + deltaY)),
      })
    }

    const handleMouseUp = () => {
      setResizingField(null)
    }

    if (resizingField) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizingField, resizeStart, fields, canvasRef, snapToGrid, gridSize, updateField])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingGroup || !canvasRef.current) return

      const group = groups.find((g) => g.id === resizingGroup)
      if (!group) return

      const deltaX = e.clientX - resizeStart.x
      const deltaY = e.clientY - resizeStart.y

      setGroups(
        groups.map((g) =>
          g.id === resizingGroup
            ? {
                ...g,
                width: Math.max(200, snap(resizeStart.width + deltaX)),
                height: Math.max(100, snap(resizeStart.height + deltaY)),
              }
            : g
        )
      )
    }

    const handleMouseUp = () => {
      setResizingGroup(null)
    }

    if (resizingGroup) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [resizingGroup, resizeStart, groups, canvasRef, snapToGrid, gridSize, setGroups])

  const handleResizeStart = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return

    setResizingField(fieldId)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: field.width,
      height: field.height,
    })
  }

  const handleGroupResizeStart = (e: React.MouseEvent, groupId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const group = groups.find((g) => g.id === groupId)
    if (!group) return

    setResizingGroup(groupId)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: group.width,
      height: group.height,
    })
  }

  return {
    resizingField,
    resizingGroup,
    handleResizeStart,
    handleGroupResizeStart,
    setResizeStart,
  }
}
