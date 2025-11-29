import type { CanvasField, CanvasGroup, CanvasSection } from "@/components/forms/canvas/types"

interface MoveOptions {
  draggedField: string | null
  draggedGroup: string | null
  draggedSection: string | null
  fields: CanvasField[]
  groups: CanvasGroup[]
  sections: CanvasSection[]
  canvasConfig: { canvasWidth?: number; canvasHeight?: number }
  canvasRef: React.RefObject<HTMLDivElement>
  dragOffset: { x: number; y: number }
  snapToGrid: boolean
  gridSize: number
  wrapOverflow: boolean
  updateField: (fieldId: string, updates: Partial<CanvasField>) => void
  setGroups: React.Dispatch<React.SetStateAction<CanvasGroup[]>>
  setSections: React.Dispatch<React.SetStateAction<CanvasSection[]>>
}

export function handleMouseMove(e: MouseEvent, options: MoveOptions) {
  const {
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
  } = options

  if (!canvasRef.current) return

  const canvasRect = canvasRef.current.getBoundingClientRect()
  const canvasWidth = canvasConfig.canvasWidth || 1200
  const canvasHeight = canvasConfig.canvasHeight || 1600

  const snap = (value: number) => {
    if (!snapToGrid) return value
    return Math.round(value / gridSize) * gridSize
  }

  if (draggedField) {
    let newX = snap(e.clientX - canvasRect.left - dragOffset.x)
    let newY = snap(e.clientY - canvasRect.top - dragOffset.y)

    if (wrapOverflow) {
      const field = fields.find((f) => f.id === draggedField)
      if (field) {
        if (newX + field.width > canvasWidth) {
          newX = 0
          newY += field.height + 20
        }
        if (newY + field.height > canvasHeight) {
          newY = 0
        }
      }
    }

    updateField(draggedField, {
      x: Math.max(
        0,
        Math.min(newX, canvasWidth - (fields.find((f) => f.id === draggedField)?.width || 0))
      ),
      y: Math.max(
        0,
        Math.min(newY, canvasHeight - (fields.find((f) => f.id === draggedField)?.height || 0))
      ),
    })
  }

  if (draggedGroup) {
    let newX = snap(e.clientX - canvasRect.left - dragOffset.x)
    let newY = snap(e.clientY - canvasRect.top - dragOffset.y)

    if (wrapOverflow) {
      const group = groups.find((g) => g.id === draggedGroup)
      if (group) {
        if (newX + group.width > canvasWidth) {
          newX = 0
          newY += group.height + 20
        }
        if (newY + group.height > canvasHeight) {
          newY = 0
        }
      }
    }

    setGroups(
      groups.map((g) =>
        g.id === draggedGroup
          ? {
              ...g,
              x: Math.max(0, Math.min(newX, canvasWidth - g.width)),
              y: Math.max(0, Math.min(newY, canvasHeight - g.height)),
            }
          : g
      )
    )
  }

  if (draggedSection) {
    let newX = snap(e.clientX - canvasRect.left - dragOffset.x)
    let newY = snap(e.clientY - canvasRect.top - dragOffset.y)

    if (wrapOverflow) {
      const section = sections.find((s) => s.id === draggedSection)
      if (section) {
        if (newX + section.width > canvasWidth) {
          newX = 0
          newY += section.height + 20
        }
        if (newY + section.height > canvasHeight) {
          newY = 0
        }
      }
    }

    setSections(
      sections.map((s) =>
        s.id === draggedSection
          ? {
              ...s,
              x: Math.max(0, Math.min(newX, canvasWidth - s.width)),
              y: Math.max(0, Math.min(newY, canvasHeight - s.height)),
            }
          : s
      )
    )
  }
}
