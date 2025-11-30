import { Check, Code, Download, Grid3x3, Settings, Upload } from "lucide-react"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import type { FieldType } from "@/components/ui/form-builder"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Stack } from "@/components/ui/stack"
import type { FieldCategory, FieldCategoryItem, SheetSize } from "./types"
import { SHEET_SIZES } from "./types"

interface CanvasFieldLibraryProps {
  fieldCategories: FieldCategory
  selectedSheetSize: string
  canvasWidth: number
  canvasHeight: number
  gridSize: number
  showGrid: boolean
  snapToGrid: boolean
  wrapOverflow: boolean
  copied: boolean
  onAddField: (
    type: FieldType | "group" | "section" | "image" | "line-horizontal" | "line-vertical" | "box"
  ) => void
  onSheetSizeChange: (size: string) => void
  onCanvasWidthChange: (width: number) => void
  onCanvasHeightChange: (height: number) => void
  onGridSizeChange: (size: number) => void
  onShowGridChange: (show: boolean) => void
  onSnapToGridChange: (snap: boolean) => void
  onWrapOverflowChange: (wrap: boolean) => void
  onExport: () => void
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void
  onCopyCode: () => void
}

export function CanvasFieldLibrary({
  fieldCategories,
  selectedSheetSize,
  canvasWidth,
  canvasHeight,
  gridSize,
  showGrid,
  snapToGrid,
  wrapOverflow,
  copied,
  onAddField,
  onSheetSizeChange,
  onCanvasWidthChange,
  onCanvasHeightChange,
  onGridSizeChange,
  onShowGridChange,
  onSnapToGridChange,
  onWrapOverflowChange,
  onExport,
  onImport,
  onCopyCode,
}: CanvasFieldLibraryProps) {
  const sheetSizes = {
    ...SHEET_SIZES,
    custom: { name: "Custom", width: canvasWidth, height: canvasHeight },
  }

  return (
    <Box className="w-72 border-r bg-[#F4F6F8] dark:bg-[#1E1E1E] p-4 overflow-y-auto">
      <Stack spacing="lg">
        {/* Canvas Settings */}
        <Box>
          <Flex className="items-center gap-2 mb-3">
            <Settings className="h-4 w-4" />
            <h3 className="text-sm font-semibold">Canvas Settings</h3>
          </Flex>
          <Stack spacing="sm">
            <Stack spacing="xs">
              <Label htmlFor="sheet-size" className="text-xs mb-1.5 block">
                Sheet Size
              </Label>
              <select
                id="sheet-size"
                value={selectedSheetSize}
                onChange={(e) => {
                  onSheetSizeChange(e.target.value)
                  if (e.target.value !== "custom") {
                    const size = sheetSizes[e.target.value as keyof typeof sheetSizes]
                    if (size) {
                      onCanvasWidthChange(size.width)
                      onCanvasHeightChange(size.height)
                    }
                  }
                }}
                className="flex h-8 w-full rounded-xs border border-[#E1E4E8] bg-background px-3 text-sm"
              >
                {Object.entries(sheetSizes).map(([key, size]) => (
                  <option key={key} value={key}>
                    {size.name} {key !== "custom" && `(${size.width}×${size.height}px)`}
                  </option>
                ))}
              </select>
            </Stack>
            {selectedSheetSize === "custom" && (
              <>
                <Stack spacing="xs">
                  <Label htmlFor="canvas-width" className="text-xs mb-1.5 block">
                    Canvas Width (px)
                  </Label>
                  <Input
                    id="canvas-width"
                    type="number"
                    value={canvasWidth}
                    onChange={(e) => onCanvasWidthChange(Number(e.target.value))}
                    className="h-8 text-sm"
                  />
                </Stack>
                <Stack spacing="xs">
                  <Label htmlFor="canvas-height" className="text-xs mb-1.5 block">
                    Canvas Height (px)
                  </Label>
                  <Input
                    id="canvas-height"
                    type="number"
                    value={canvasHeight}
                    onChange={(e) => onCanvasHeightChange(Number(e.target.value))}
                    className="h-8 text-sm"
                  />
                </Stack>
              </>
            )}
            {selectedSheetSize !== "custom" && (
              <Box className="text-xs text-muted-foreground p-2 bg-muted rounded-xs">
                {sheetSizes[selectedSheetSize as keyof typeof sheetSizes]?.name}: {canvasWidth} ×{" "}
                {canvasHeight} px
              </Box>
            )}
            <Stack spacing="xs">
              <Label htmlFor="grid-size" className="text-xs mb-1.5 block">
                Grid Size
              </Label>
              <Input
                id="grid-size"
                type="number"
                value={gridSize}
                onChange={(e) => onGridSizeChange(Number(e.target.value))}
                className="h-8 text-sm"
              />
            </Stack>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => onShowGridChange(e.target.checked)}
                className="h-4 w-4 rounded-xs border border-[#E1E4E8]"
              />
              <span className="text-xs flex items-center gap-1">
                <Grid3x3 className="h-3 w-3" />
                Show Grid
              </span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => onSnapToGridChange(e.target.checked)}
                className="h-4 w-4 rounded-xs border border-[#E1E4E8]"
              />
              <span className="text-xs">Snap to Grid</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wrapOverflow}
                onChange={(e) => onWrapOverflowChange(e.target.checked)}
                className="h-4 w-4 rounded-xs border border-[#E1E4E8]"
              />
              <span className="text-xs">Wrap Overflow</span>
            </label>
          </Stack>
        </Box>

        {/* Field Library */}
        {Object.entries(fieldCategories).map(([category, items]) => (
          <Box key={category}>
            <h3 className="text-sm font-semibold mb-2">{category}</h3>
            <Box className="grid grid-cols-2 gap-2">
              {items.map(({ type, label, icon }) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="h-auto py-2.5 flex flex-col items-center gap-1 text-xs"
                  onClick={() => onAddField(type)}
                >
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </Button>
              ))}
            </Box>
          </Box>
        ))}

        {/* Import/Export */}
        <Box className="pt-4 border-t">
          <Stack spacing="xs">
            <Button variant="outline" size="sm" onClick={onExport} className="w-full">
              <Download className="h-3 w-3 mr-2" />
              Export JSON
            </Button>
            <label className="w-full">
              <Button variant="outline" size="sm" asChild className="w-full">
                <span>
                  <Upload className="h-3 w-3 mr-2" />
                  Import JSON
                </span>
              </Button>
              <input type="file" accept=".json" onChange={onImport} className="hidden" />
            </label>
            <Button variant="outline" size="sm" onClick={onCopyCode} className="w-full">
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Code className="h-3 w-3 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  )
}
