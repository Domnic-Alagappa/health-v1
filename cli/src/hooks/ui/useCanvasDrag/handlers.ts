import type { CanvasField, CanvasGroup, CanvasSection } from "@/components/forms/canvas/types"

interface DragHandlers {
  handleFieldDragStart: (e: React.MouseEvent, fieldId: string) => void
  handleGroupDragStart: (e: React.MouseEvent, groupId: string) => void
  handleSectionDragStart: (e: React.MouseEvent, sectionId: string) => void
}

interface DragHandlersOptions {
  fields: CanvasField[]
  groups: CanvasGroup[]
  sections: CanvasSection[]
  canvasRef: React.RefObject<HTMLDivElement>
  setDraggedField: (id: string | null) => void
  setDraggedGroup: (id: string | null) => void
  setDraggedSection: (id: string | null) => void
  setDragOffset: (offset: { x: number; y: number }) => void
}

export function createDragHandlers({
  fields,
  groups,
  sections,
  canvasRef,
  setDraggedField,
  setDraggedGroup,
  setDraggedSection,
  setDragOffset,
}: DragHandlersOptions): DragHandlers {
  const handleFieldDragStart = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return

    setDraggedField(fieldId)
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (canvasRect) {
      setDragOffset({
        x: e.clientX - canvasRect.left - field.x,
        y: e.clientY - canvasRect.top - field.y,
      })
    }
  }

  const handleGroupDragStart = (e: React.MouseEvent, groupId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const group = groups.find((g) => g.id === groupId)
    if (!group) return

    setDraggedGroup(groupId)
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (canvasRect) {
      setDragOffset({
        x: e.clientX - canvasRect.left - group.x,
        y: e.clientY - canvasRect.top - group.y,
      })
    }
  }

  const handleSectionDragStart = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const section = sections.find((s) => s.id === sectionId)
    if (!section) return

    setDraggedSection(sectionId)
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (canvasRect) {
      setDragOffset({
        x: e.clientX - canvasRect.left - section.x,
        y: e.clientY - canvasRect.top - section.y,
      })
    }
  }

  return {
    handleFieldDragStart,
    handleGroupDragStart,
    handleSectionDragStart,
  }
}
