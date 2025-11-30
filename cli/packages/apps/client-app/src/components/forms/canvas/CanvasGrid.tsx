import { Box } from "@/components/ui/box"

interface CanvasGridProps {
  showGrid: boolean
  gridSize: number
}

export function CanvasGrid({ showGrid, gridSize }: CanvasGridProps) {
  if (!showGrid) return null

  return (
    <Box
      className="absolute inset-0 pointer-events-none opacity-20"
      style={{
        backgroundImage: `linear-gradient(to right, #E1E4E8 1px, transparent 1px),
          linear-gradient(to bottom, #E1E4E8 1px, transparent 1px)`,
        backgroundSize: `${gridSize}px ${gridSize}px`,
      }}
    />
  )
}
