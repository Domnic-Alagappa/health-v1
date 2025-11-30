import { useState } from "react"
import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { FormCanvasPreview } from "@/components/ui/form-canvas-preview"
import { useCanvasOperations } from "@/hooks/forms/useCanvasOperations"
import { useFormCanvas } from "@/hooks/forms/useFormCanvas"
import { useCanvasDrag } from "@/hooks/ui/useCanvasDrag"
import { useCanvasResize } from "@/hooks/ui/useCanvasResize"
import { Canvas } from "./Canvas"
import { CanvasFieldLibrary } from "./CanvasFieldLibrary"
import { CanvasPropertyPanel } from "./CanvasPropertyPanel"
import { CanvasToolbar } from "./CanvasToolbar"
import { FIELD_CATEGORIES } from "./constants"

export function FormCanvasBuilder() {
  const {
    fields,
    setFields,
    groups,
    setGroups,
    sections,
    setSections,
    selectedField,
    setSelectedField,
    selectedGroup,
    setSelectedGroup,
    selectedSection,
    setSelectedSection,
    canvasConfig,
    setCanvasConfig,
    canvasRef,
    updateField,
    removeField,
    removeGroup,
    removeSection,
  } = useFormCanvas()

  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize, setGridSize] = useState(10)
  const [wrapOverflow, setWrapOverflow] = useState(true)
  const [selectedSheetSize, setSelectedSheetSize] = useState<string>("a4")
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit")

  const { copied, addField, exportConfig, importConfig, copyCode } = useCanvasOperations({
    fields,
    groups,
    sections,
    canvasConfig,
    setFields,
    setGroups,
    setSections,
    setCanvasConfig,
    setSelectedField,
    setSelectedGroup,
    setSelectedSection,
  })

  const snap = (value: number) => {
    if (!snapToGrid) return value
    return Math.round(value / gridSize) * gridSize
  }

  const {
    draggedField,
    draggedGroup,
    draggedSection,
    handleFieldDragStart,
    handleGroupDragStart,
    handleSectionDragStart,
  } = useCanvasDrag({
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
  })

  const { handleResizeStart, handleGroupResizeStart } = useCanvasResize({
    fields,
    groups,
    canvasRef,
    snapToGrid,
    gridSize,
    updateField,
    setGroups,
  })

  const selectedFieldData = fields.find((f) => f.id === selectedField)
  const selectedGroupData = groups.find((g) => g.id === selectedGroup)
  const selectedSectionData = sections.find((s) => s.id === selectedSection)

  return (
    <Flex className="h-screen overflow-hidden bg-background">
      <CanvasFieldLibrary
        fieldCategories={FIELD_CATEGORIES}
        selectedSheetSize={selectedSheetSize}
        canvasWidth={canvasConfig.canvasWidth || 1200}
        canvasHeight={canvasConfig.canvasHeight || 1600}
        gridSize={gridSize}
        showGrid={showGrid}
        snapToGrid={snapToGrid}
        wrapOverflow={wrapOverflow}
        copied={copied}
        onAddField={addField}
        onSheetSizeChange={setSelectedSheetSize}
        onCanvasWidthChange={(width) => setCanvasConfig({ ...canvasConfig, canvasWidth: width })}
        onCanvasHeightChange={(height) =>
          setCanvasConfig({ ...canvasConfig, canvasHeight: height })
        }
        onGridSizeChange={setGridSize}
        onShowGridChange={setShowGrid}
        onSnapToGridChange={setSnapToGrid}
        onWrapOverflowChange={setWrapOverflow}
        onExport={exportConfig}
        onImport={importConfig}
        onCopyCode={copyCode}
      />

      <Flex direction="column" className="flex-1 overflow-hidden">
        <CanvasToolbar
          viewMode={viewMode}
          fieldCount={fields.length}
          onViewModeChange={setViewMode}
        />

        {viewMode === "preview" ? (
          <FormCanvasPreview
            fields={fields.map(({ selected, ...field }) => field)}
            groups={groups.map(({ selected, ...group }) => group)}
            sections={sections.map(({ selected, ...section }) => section)}
            canvasWidth={canvasConfig.canvasWidth || 1200}
            canvasHeight={canvasConfig.canvasHeight || 1600}
            sheetSize={selectedSheetSize}
          />
        ) : (
          <Box className="flex-1 overflow-auto bg-[#F4F6F8]">
            <Canvas
              canvasRef={canvasRef}
              canvasWidth={canvasConfig.canvasWidth || 1200}
              canvasHeight={canvasConfig.canvasHeight || 1600}
              showGrid={showGrid}
              gridSize={gridSize}
              fields={fields}
              groups={groups}
              sections={sections}
              selectedField={selectedField}
              selectedGroup={selectedGroup}
              selectedSection={selectedSection}
              draggedField={draggedField}
              draggedGroup={draggedGroup}
              draggedSection={draggedSection}
              onFieldSelect={setSelectedField}
              onGroupSelect={setSelectedGroup}
              onSectionSelect={setSelectedSection}
              onFieldDragStart={handleFieldDragStart}
              onGroupDragStart={handleGroupDragStart}
              onSectionDragStart={handleSectionDragStart}
              onFieldResizeStart={handleResizeStart}
              onGroupResizeStart={handleGroupResizeStart}
              onSectionResizeStart={(e, sectionId) => {
                const section = sections.find((s) => s.id === sectionId)
                if (section) {
                  handleGroupResizeStart(e, sectionId)
                }
              }}
              onCanvasClick={() => {
                setSelectedField(null)
                setSelectedGroup(null)
                setSelectedSection(null)
              }}
            />
          </Box>
        )}
      </Flex>

      <CanvasPropertyPanel
        selectedField={selectedFieldData || null}
        selectedGroup={selectedGroupData || null}
        selectedSection={selectedSectionData || null}
        snap={snap}
        onUpdateField={updateField}
        onUpdateGroup={(groupId, updates) =>
          setGroups(groups.map((g) => (g.id === groupId ? { ...g, ...updates } : g)))
        }
        onUpdateSection={(sectionId, updates) =>
          setSections(sections.map((s) => (s.id === sectionId ? { ...s, ...updates } : s)))
        }
        onRemoveField={removeField}
        onRemoveGroup={removeGroup}
        onRemoveSection={removeSection}
      />
    </Flex>
  )
}
