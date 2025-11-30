import { Box } from "@/components/ui/box"
import { Card } from "@/components/ui/card"
import { Stack } from "@/components/ui/stack"
import { cn } from "@/lib/utils"
import type { CanvasField as CanvasFieldType } from "./types"

interface CanvasFieldProps {
  field: CanvasFieldType
  isSelected: boolean
  isDragging: boolean
  onSelect: () => void
  onDragStart: (e: React.MouseEvent) => void
  onResizeStart: (e: React.MouseEvent) => void
}

export function CanvasField({
  field,
  isSelected,
  isDragging,
  onSelect,
  onDragStart,
  onResizeStart,
}: CanvasFieldProps) {
  return (
    <Box
      className={cn(
        "absolute border-2 cursor-move transition-all",
        isSelected
          ? "border-primary shadow-fluent-2 z-10"
          : "border-transparent hover:border-[#E1E4E8] z-0",
        isDragging && "opacity-75"
      )}
      style={{
        left: `${field.x}px`,
        top: `${field.y}px`,
        width: `${field.width}px`,
        height: `${field.height}px`,
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onMouseDown={onDragStart}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", field.id)
      }}
    >
      {/* Field Content Preview */}
      <Box className="w-full h-full p-2 bg-white">
        {field.imageUrl ? (
          <Box className="w-full h-full flex items-center justify-center bg-gray-50 border border-[#E1E4E8] rounded-xs overflow-hidden">
            <img
              src={field.imageUrl}
              alt={field.label || "Image"}
              className="max-w-full max-h-full object-contain"
            />
          </Box>
        ) : field.lineDirection === "horizontal" ? (
          <Box
            className="w-full h-full"
            style={{
              borderTop: `${field.borderWidth || 1}px ${field.borderStyle || "solid"} ${field.borderColor || "#1C1C1E"}`,
            }}
          />
        ) : field.lineDirection === "vertical" ? (
          <Box
            className="w-full h-full"
            style={{
              borderLeft: `${field.borderWidth || 1}px ${field.borderStyle || "solid"} ${field.borderColor || "#1C1C1E"}`,
            }}
          />
        ) : field.borderStyle && field.borderStyle !== "none" ? (
          <Box
            className="w-full h-full"
            style={{
              border: `${field.borderWidth || 1}px ${field.borderStyle || "solid"} ${field.borderColor || "#1C1C1E"}`,
            }}
          />
        ) : field.type === "separator" ? (
          <Box className="w-full h-full border-t-2 border-[#E1E4E8] flex items-center">
            {field.label && (
              <span className="text-xs text-muted-foreground px-2">{field.label}</span>
            )}
          </Box>
        ) : field.type === "display-text" ? (
          <Box className="text-sm font-semibold">{field.label || "Display Text"}</Box>
        ) : (
          <Stack spacing="xs">
            <Box className="text-xs font-medium text-muted-foreground">{field.label}</Box>
            <Box className="h-6 border border-[#E1E4E8] rounded-xs bg-background" />
          </Stack>
        )}
      </Box>

      {/* Resize Handle */}
      {isSelected && (
        <Box
          className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-white"
          onMouseDown={(e) => {
            e.stopPropagation()
            onResizeStart(e)
          }}
        />
      )}
    </Box>
  )
}
