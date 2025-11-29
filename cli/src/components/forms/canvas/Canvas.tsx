import { Box } from "@/components/ui/box"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { CanvasField } from "./CanvasField"
import { CanvasGrid } from "./CanvasGrid"
import type { CanvasField as CanvasFieldType, CanvasGroup, CanvasSection } from "./types"

interface CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>
  canvasWidth: number
  canvasHeight: number
  showGrid: boolean
  gridSize: number
  fields: CanvasFieldType[]
  groups: CanvasGroup[]
  sections: CanvasSection[]
  selectedField: string | null
  selectedGroup: string | null
  selectedSection: string | null
  draggedField: string | null
  draggedGroup: string | null
  draggedSection: string | null
  onFieldSelect: (fieldId: string) => void
  onGroupSelect: (groupId: string) => void
  onSectionSelect: (sectionId: string) => void
  onFieldDragStart: (e: React.MouseEvent, fieldId: string) => void
  onGroupDragStart: (e: React.MouseEvent, groupId: string) => void
  onSectionDragStart: (e: React.MouseEvent, sectionId: string) => void
  onFieldResizeStart: (e: React.MouseEvent, fieldId: string) => void
  onGroupResizeStart: (e: React.MouseEvent, groupId: string) => void
  onSectionResizeStart: (e: React.MouseEvent, sectionId: string) => void
  onCanvasClick: () => void
}

export function Canvas({
  canvasRef,
  canvasWidth,
  canvasHeight,
  showGrid,
  gridSize,
  fields,
  groups,
  sections,
  selectedField,
  selectedGroup,
  selectedSection,
  draggedField,
  draggedGroup,
  draggedSection,
  onFieldSelect,
  onGroupSelect,
  onSectionSelect,
  onFieldDragStart,
  onGroupDragStart,
  onSectionDragStart,
  onFieldResizeStart,
  onGroupResizeStart,
  onSectionResizeStart,
  onCanvasClick,
}: CanvasProps) {
  return (
    <Box
      ref={canvasRef}
      className="relative mx-auto bg-white dark:bg-[#2B2B2B] shadow-fluent-3"
      style={{
        width: `${canvasWidth}px`,
        height: `${canvasHeight}px`,
        minHeight: `${canvasHeight}px`,
      }}
    >
      <CanvasGrid showGrid={showGrid} gridSize={gridSize} />

      {sections.map((section) => (
        <Card
          key={section.id}
          className={cn(
            "absolute border-2 cursor-move transition-all bg-[#F4F6F8] dark:bg-[#1E1E1E]",
            selectedSection === section.id
              ? "border-primary shadow-fluent-2 z-10"
              : "border-[#E1E4E8] hover:border-primary/50 z-0",
            draggedSection === section.id && "opacity-75"
          )}
          style={{
            left: `${section.x}px`,
            top: `${section.y}px`,
            width: `${section.width}px`,
            height: `${section.height}px`,
          }}
          onClick={(e) => {
            e.stopPropagation()
            onSectionSelect(section.id)
          }}
          onMouseDown={(e) => onSectionDragStart(e, section.id)}
        >
          <Box className="w-full h-full p-4 flex items-center border-b-2 border-primary">
            <h3 className="text-lg font-semibold">{section.title || "Section"}</h3>
          </Box>
          {selectedSection === section.id && (
            <Box
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-white dark:border-[#2B2B2B] rounded-full cursor-se-resize z-20"
              onMouseDown={(e) => {
                e.stopPropagation()
                onSectionResizeStart(e, section.id)
              }}
            />
          )}
        </Card>
      ))}

      {groups.map((group) => (
        <Card
          key={group.id}
          className={cn(
            "absolute border-2 cursor-move transition-all bg-white dark:bg-[#2B2B2B] shadow-fluent-1",
            selectedGroup === group.id
              ? "border-primary shadow-fluent-2 z-10"
              : "border-[#E1E4E8] hover:border-primary/50 z-0",
            draggedGroup === group.id && "opacity-75"
          )}
          style={{
            left: `${group.x}px`,
            top: `${group.y}px`,
            width: `${group.width}px`,
            height: `${group.height}px`,
          }}
          onClick={(e) => {
            e.stopPropagation()
            onGroupSelect(group.id)
          }}
          onMouseDown={(e) => onGroupDragStart(e, group.id)}
        >
          <Box className="w-full p-3 border-b border-[#E1E4E8] bg-[#F4F6F8] dark:bg-[#1E1E1E]">
            <h4 className="text-sm font-semibold">{group.title || "Group"}</h4>
            {group.description && (
              <p className="text-xs text-muted-foreground mt-1">{group.description}</p>
            )}
          </Box>
          <Box
            className="p-2 overflow-auto"
            style={{ height: `${group.height - 60}px` }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
          >
            {group.fields.map((fieldId) => {
              const field = fields.find((f) => f.id === fieldId)
              if (!field) return null
              return (
                <Card
                  key={fieldId}
                  className="mb-2 p-2 border border-[#E1E4E8] rounded-xs bg-background cursor-pointer hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFieldSelect(fieldId)
                  }}
                >
                  <Box className="text-xs font-medium">{field.label}</Box>
                </Card>
              )
            })}
            {group.fields.length === 0 && (
              <Box className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed border-[#E1E4E8] rounded-xs">
                Drag fields here to add to group
              </Box>
            )}
          </Box>
          {selectedGroup === group.id && (
            <Box
              className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-white dark:border-[#2B2B2B] rounded-full cursor-se-resize z-20"
              onMouseDown={(e) => {
                e.stopPropagation()
                onGroupResizeStart(e, group.id)
              }}
            />
          )}
        </Card>
      ))}

      {fields
        .filter((field) => !field.groupId)
        .map((field) => (
          <CanvasField
            key={field.id}
            field={field}
            isSelected={selectedField === field.id}
            isDragging={draggedField === field.id}
            onSelect={() => onFieldSelect(field.id)}
            onDragStart={(e) => onFieldDragStart(e, field.id)}
            onResizeStart={(e) => onFieldResizeStart(e, field.id)}
          />
        ))}

      <Box className="absolute inset-0" onClick={onCanvasClick} />
    </Box>
  )
}
