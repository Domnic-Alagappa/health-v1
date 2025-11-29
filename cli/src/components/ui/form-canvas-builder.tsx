import * as React from "react"
import { Plus, Trash2, GripVertical, Eye, Code, Download, Upload, Copy, Check, Settings, Grid3x3, Move, Maximize2, Save, Printer } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { Input } from "./input"
import { Label } from "./label"
import { FormBuilder, FormConfig, FormField, FieldType } from "./form-builder"
import { FormCanvasPreview } from "./form-canvas-preview"
import { cn } from "@/lib/utils"

/**
 * Visual Canvas Form Builder - Corel Draw style
 * Physical form designer with absolute positioning, drag & drop, and free resizing
 */

interface CanvasField extends FormField {
  x: number // X position on canvas
  y: number // Y position on canvas
  width: number // Width in pixels
  height: number // Height in pixels
  selected?: boolean
  groupId?: string // For grouping fields
  imageUrl?: string // For image/logo fields
  borderStyle?: "solid" | "dashed" | "dotted" | "double" | "none" // Border style for boxes
  borderWidth?: number // Border width in pixels
  borderColor?: string // Border color
  lineDirection?: "horizontal" | "vertical" // For line elements
}

interface CanvasGroup {
  id: string
  title?: string
  description?: string
  x: number
  y: number
  width: number
  height: number
  fields: string[] // Field IDs
  selected?: boolean
  collapsible?: boolean
  collapsed?: boolean
}

interface CanvasSection {
  id: string
  title?: string
  x: number
  y: number
  width: number
  height: number
  selected?: boolean
}

interface CanvasFormConfig extends FormConfig {
  canvasWidth?: number
  canvasHeight?: number
  snapToGrid?: boolean
  gridSize?: number
}

export function FormCanvasBuilder() {
  const [fields, setFields] = React.useState<CanvasField[]>([])
  const [groups, setGroups] = React.useState<CanvasGroup[]>([])
  const [sections, setSections] = React.useState<CanvasSection[]>([])
  const [selectedField, setSelectedField] = React.useState<string | null>(null)
  const [selectedGroup, setSelectedGroup] = React.useState<string | null>(null)
  const [selectedSection, setSelectedSection] = React.useState<string | null>(null)
  const [draggedField, setDraggedField] = React.useState<string | null>(null)
  const [draggedGroup, setDraggedGroup] = React.useState<string | null>(null)
  const [draggedSection, setDraggedSection] = React.useState<string | null>(null)
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 })
  const [resizingField, setResizingField] = React.useState<string | null>(null)
  const [resizingGroup, setResizingGroup] = React.useState<string | null>(null)
  const [resizeStart, setResizeStart] = React.useState({ x: 0, y: 0, width: 0, height: 0 })
  const [showGrid, setShowGrid] = React.useState(true)
  const [snapToGrid, setSnapToGrid] = React.useState(true)
  const [gridSize, setGridSize] = React.useState(10)
  const [wrapOverflow, setWrapOverflow] = React.useState(true)
  const [selectedSheetSize, setSelectedSheetSize] = React.useState<string>("a4")
  const [viewMode, setViewMode] = React.useState<"edit" | "preview">("edit")
  const [canvasConfig, setCanvasConfig] = React.useState<CanvasFormConfig>({
    id: "canvas-form-1",
    title: "Visual Form",
    canvasWidth: 1200,
    canvasHeight: 1600,
    snapToGrid: true,
    gridSize: 10,
    layout: "single",
  })

  // Sheet size presets (in pixels at 96 DPI)
  const sheetSizes = {
    a4: { name: "A4", width: 794, height: 1123 }, // 210mm × 297mm
    letter: { name: "US Letter", width: 816, height: 1056 }, // 8.5" × 11"
    legal: { name: "US Legal", width: 816, height: 1344 }, // 8.5" × 14"
    a3: { name: "A3", width: 1123, height: 1587 }, // 297mm × 420mm
    a5: { name: "A5", width: 559, height: 794 }, // 148mm × 210mm
    tabloid: { name: "Tabloid", width: 1056, height: 1632 }, // 11" × 17"
    custom: { name: "Custom", width: canvasConfig.canvasWidth || 1200, height: canvasConfig.canvasHeight || 1600 },
  }

  // Update canvas when sheet size changes
  React.useEffect(() => {
    if (selectedSheetSize !== "custom") {
      const size = sheetSizes[selectedSheetSize as keyof typeof sheetSizes]
      if (size && (canvasConfig.canvasWidth !== size.width || canvasConfig.canvasHeight !== size.height)) {
        setCanvasConfig((prev) => ({
          ...prev,
          canvasWidth: size.width,
          canvasHeight: size.height,
        }))
      }
    }
  }, [selectedSheetSize])
  const [copied, setCopied] = React.useState(false)
  const canvasRef = React.useRef<HTMLDivElement>(null)

  // Field categories
  const fieldCategories = {
    "Field Elements": [
      { type: "text" as FieldType, label: "Input", icon: "📝" },
      { type: "textarea" as FieldType, label: "Textarea", icon: "📄" },
      { type: "email" as FieldType, label: "Email", icon: "✉️" },
      { type: "number" as FieldType, label: "Number", icon: "🔢" },
      { type: "date" as FieldType, label: "Date", icon: "📅" },
      { type: "select" as FieldType, label: "Select", icon: "📋" },
      { type: "checkbox" as FieldType, label: "Checkbox", icon: "☐" },
      { type: "radio" as FieldType, label: "Radio", icon: "🔘" },
      { type: "file" as FieldType, label: "File", icon: "📎" },
    ],
    "Display Elements": [
      { type: "display-text" as FieldType, label: "Text", icon: "📝" },
      { type: "separator" as FieldType, label: "Separator", icon: "➖" },
      { type: "image" as any, label: "Image/Logo", icon: "🖼️" },
    ],
    "Shapes & Lines": [
      { type: "line-horizontal" as any, label: "Horizontal Line", icon: "➖" },
      { type: "line-vertical" as any, label: "Vertical Line", icon: "|" },
      { type: "box" as any, label: "Box", icon: "▦" },
    ],
    "Containers": [
      { type: "group" as any, label: "Group", icon: "📦" },
      { type: "section" as any, label: "Section", icon: "📑" },
    ],
  }

  // Snap to grid helper
  const snap = (value: number) => {
    if (!snapToGrid) return value
    return Math.round(value / gridSize) * gridSize
  }

  // Add new field to canvas
  const addField = (type: FieldType | "group" | "section") => {
    if (type === "group") {
      const newGroup: CanvasGroup = {
        id: `group-${Date.now()}`,
        title: `Group ${groups.length + 1}`,
        x: 50 + (groups.length % 3) * 300,
        y: 50 + Math.floor(groups.length / 3) * 200,
        width: 400,
        height: 300,
        fields: [],
        collapsible: true,
        collapsed: false,
      }
      setGroups([...groups, newGroup])
      setSelectedGroup(newGroup.id)
      return
    }

    if (type === "section") {
      const newSection: CanvasSection = {
        id: `section-${Date.now()}`,
        title: `Section ${sections.length + 1}`,
        x: 50,
        y: 50 + sections.length * 150,
        width: canvasConfig.canvasWidth ? canvasConfig.canvasWidth - 100 : 1100,
        height: 80,
      }
      setSections([...sections, newSection])
      setSelectedSection(newSection.id)
      return
    }

    // Handle special field types
    if (type === "image") {
      const newField: CanvasField = {
        id: `field-${Date.now()}`,
        name: `image${fields.length + 1}`,
        label: "Image/Logo",
        type: "display-text", // Use display-text as base type
        x: 50 + (fields.length % 5) * 200,
        y: 50 + Math.floor(fields.length / 5) * 100,
        width: 200,
        height: 100,
        imageUrl: "",
      }
      setFields([...fields, newField])
      setSelectedField(newField.id)
      return
    }

    if (type === "line-horizontal") {
      const newField: CanvasField = {
        id: `field-${Date.now()}`,
        name: `line${fields.length + 1}`,
        label: "",
        type: "separator",
        x: 50 + (fields.length % 5) * 200,
        y: 50 + Math.floor(fields.length / 5) * 100,
        width: 400,
        height: 2,
        lineDirection: "horizontal",
        borderWidth: 1,
        borderColor: "#1C1C1E",
      }
      setFields([...fields, newField])
      setSelectedField(newField.id)
      return
    }

    if (type === "line-vertical") {
      const newField: CanvasField = {
        id: `field-${Date.now()}`,
        name: `line${fields.length + 1}`,
        label: "",
        type: "separator",
        x: 50 + (fields.length % 5) * 200,
        y: 50 + Math.floor(fields.length / 5) * 100,
        width: 2,
        height: 200,
        lineDirection: "vertical",
        borderWidth: 1,
        borderColor: "#1C1C1E",
      }
      setFields([...fields, newField])
      setSelectedField(newField.id)
      return
    }

    if (type === "box") {
      const newField: CanvasField = {
        id: `field-${Date.now()}`,
        name: `box${fields.length + 1}`,
        label: "",
        type: "display-text",
        x: 50 + (fields.length % 5) * 200,
        y: 50 + Math.floor(fields.length / 5) * 100,
        width: 200,
        height: 150,
        borderStyle: "solid",
        borderWidth: 1,
        borderColor: "#1C1C1E",
      }
      setFields([...fields, newField])
      setSelectedField(newField.id)
      return
    }

    const newField: CanvasField = {
      id: `field-${Date.now()}`,
      name: `field${fields.length + 1}`,
      label: type === "separator" ? "" : type === "display-text" ? "Display Text" : `Field ${fields.length + 1}`,
      type,
      x: 50 + (fields.length % 5) * 200,
      y: 50 + Math.floor(fields.length / 5) * 100,
      width: type === "textarea" ? 300 : type === "separator" ? 400 : 200,
      height: type === "textarea" ? 100 : type === "separator" ? 2 : 40,
      placeholder: type !== "separator" && type !== "display-text" ? `Enter ${type}...` : undefined,
      layout: {
        colSpan: 12,
        size: "md",
      },
    }
    setFields([...fields, newField])
    setSelectedField(newField.id)
  }

  // Add field to group
  const addFieldToGroup = (fieldId: string, groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    if (!group) return

    // Update field position relative to group
    const field = fields.find((f) => f.id === fieldId)
    if (field) {
      updateField(fieldId, {
        x: group.x + 20,
        y: group.y + 40 + group.fields.length * 60,
        groupId: groupId,
      })
    }

    setGroups(
      groups.map((g) =>
        g.id === groupId ? { ...g, fields: [...g.fields, fieldId] } : g
      )
    )
  }

  // Remove group
  const removeGroup = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    if (group) {
      // Remove groupId from fields
      setFields(fields.map((f) => (f.groupId === groupId ? { ...f, groupId: undefined } : f)))
    }
    setGroups(groups.filter((g) => g.id !== groupId))
    if (selectedGroup === groupId) {
      setSelectedGroup(null)
    }
  }

  // Remove section
  const removeSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId))
    if (selectedSection === sectionId) {
      setSelectedSection(null)
    }
  }

  // Remove field
  const removeField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId))
    if (selectedField === fieldId) {
      setSelectedField(null)
    }
  }

  // Update field
  const updateField = (fieldId: string, updates: Partial<CanvasField>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)))
  }

  // Handle field drag start
  const handleFieldDragStart = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return

    setDraggedField(fieldId)
    setSelectedField(fieldId)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const canvasRect = canvasRef.current?.getBoundingClientRect()
    if (canvasRect) {
      setDragOffset({
        x: e.clientX - canvasRect.left - field.x,
        y: e.clientY - canvasRect.top - field.y,
      })
    }
  }

  // Handle canvas mouse move
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return

      const canvasRect = canvasRef.current.getBoundingClientRect()
      const canvasWidth = canvasConfig.canvasWidth || 1200
      const canvasHeight = canvasConfig.canvasHeight || 1600

      if (draggedField) {
        let newX = snap(e.clientX - canvasRect.left - dragOffset.x)
        let newY = snap(e.clientY - canvasRect.top - dragOffset.y)

        // Overflow wrapping
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
          x: Math.max(0, Math.min(newX, canvasWidth - (fields.find((f) => f.id === draggedField)?.width || 0))),
          y: Math.max(0, Math.min(newY, canvasHeight - (fields.find((f) => f.id === draggedField)?.height || 0))),
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

    const handleMouseUp = () => {
      setDraggedField(null)
      setDraggedGroup(null)
      setDraggedSection(null)
    }

    if (draggedField || draggedGroup || draggedSection) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [draggedField, draggedGroup, draggedSection, dragOffset, wrapOverflow, canvasConfig, fields, groups, sections])

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, fieldId: string, corner: "se" | "sw" | "ne" | "nw") => {
    e.preventDefault()
    e.stopPropagation()
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return

    setResizingField(fieldId)
    setSelectedField(fieldId)
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: field.width,
      height: field.height,
    })
  }

  // Handle resize
  React.useEffect(() => {
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
  }, [resizingField, resizeStart])

  // Export to JSON
  const exportConfig = () => {
    const config: FormConfig = {
      id: canvasConfig.id || "form-1",
      title: canvasConfig.title,
      description: canvasConfig.description,
      fields: fields.map(({ x, y, width, height, selected, ...field }) => ({
        ...field,
        layout: {
          ...field.layout,
          // Convert pixel positions to grid spans (approximate)
          colSpan: Math.max(1, Math.min(12, Math.round((width / (canvasConfig.canvasWidth || 1200)) * 12))) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
        },
      })),
      layout: canvasConfig.layout,
      gap: canvasConfig.gap,
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${config.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import from JSON
  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string) as FormConfig
        // Convert grid-based config to canvas positions
        const canvasFields: CanvasField[] = config.fields.map((field, index) => ({
          ...field,
          x: 50 + (index % 5) * 200,
          y: 50 + Math.floor(index / 5) * 100,
          width: (field.layout?.colSpan || 6) * 100,
          height: field.type === "textarea" ? 100 : 40,
        }))
        setFields(canvasFields)
        setCanvasConfig({
          ...canvasConfig,
          ...config,
        })
      } catch (error) {
        console.error("Error importing config:", error)
        alert("Error importing form config.")
      }
    }
    reader.readAsText(file)
  }

  // Generate code
  const generateCode = () => {
    const config: FormConfig = {
      id: canvasConfig.id || "form-1",
      ...canvasConfig,
      fields: fields.map(({ x, y, width, height, selected, ...field }) => field),
    }
    return `import { FormBuilder, FormConfig } from "@/components/ui/form-builder"

const formConfig: FormConfig = ${JSON.stringify(config, null, 2)}

export function MyForm() {
  const handleSubmit = async (data: Record<string, unknown>) => {
    console.log("Form data:", data)
  }

  return <FormBuilder config={formConfig} onSubmit={handleSubmit} />
}`
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generateCode())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const selectedFieldData = fields.find((f) => f.id === selectedField)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar - Field Library */}
      <div className="w-72 border-r bg-[#F4F6F8] dark:bg-[#1E1E1E] p-4 overflow-y-auto">
        <div className="space-y-6">
          {/* Canvas Settings */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Canvas Settings
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="sheet-size" className="text-xs mb-1.5 block">Sheet Size</Label>
                <select
                  id="sheet-size"
                  value={selectedSheetSize}
                  onChange={(e) => {
                    setSelectedSheetSize(e.target.value)
                    if (e.target.value !== "custom") {
                      const size = sheetSizes[e.target.value as keyof typeof sheetSizes]
                      if (size) {
                        setCanvasConfig({
                          ...canvasConfig,
                          canvasWidth: size.width,
                          canvasHeight: size.height,
                        })
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
              </div>
              {selectedSheetSize === "custom" && (
                <>
                  <div>
                    <Label htmlFor="canvas-width" className="text-xs mb-1.5 block">Canvas Width (px)</Label>
                    <Input
                      id="canvas-width"
                      type="number"
                      value={canvasConfig.canvasWidth || 1200}
                      onChange={(e) =>
                        setCanvasConfig({ ...canvasConfig, canvasWidth: Number(e.target.value) })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="canvas-height" className="text-xs mb-1.5 block">Canvas Height (px)</Label>
                    <Input
                      id="canvas-height"
                      type="number"
                      value={canvasConfig.canvasHeight || 1600}
                      onChange={(e) =>
                        setCanvasConfig({ ...canvasConfig, canvasHeight: Number(e.target.value) })
                      }
                      className="h-8 text-sm"
                    />
                  </div>
                </>
              )}
              {selectedSheetSize !== "custom" && (
                <div className="text-xs text-muted-foreground p-2 bg-muted rounded-xs">
                  {sheetSizes[selectedSheetSize as keyof typeof sheetSizes]?.name}:{" "}
                  {canvasConfig.canvasWidth} × {canvasConfig.canvasHeight} px
                </div>
              )}
              <div>
                <Label htmlFor="grid-size" className="text-xs mb-1.5 block">Grid Size</Label>
                <Input
                  id="grid-size"
                  type="number"
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value))}
                  className="h-8 text-sm"
                />
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
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
                  onChange={(e) => setSnapToGrid(e.target.checked)}
                  className="h-4 w-4 rounded-xs border border-[#E1E4E8]"
                />
                <span className="text-xs">Snap to Grid</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wrapOverflow}
                  onChange={(e) => setWrapOverflow(e.target.checked)}
                  className="h-4 w-4 rounded-xs border border-[#E1E4E8]"
                />
                <span className="text-xs">Wrap Overflow</span>
              </label>
            </div>
          </div>

          {/* Field Library */}
          {Object.entries(fieldCategories).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold mb-2">{category}</h3>
              <div className="grid grid-cols-2 gap-2">
                {items.map(({ type, label, icon }) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2.5 flex flex-col items-center gap-1 text-xs"
                    onClick={() => addField(type)}
                  >
                    <span className="text-base">{icon}</span>
                    <span>{label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}

          {/* Import/Export */}
          <div className="pt-4 border-t space-y-2">
            <Button variant="outline" size="sm" onClick={exportConfig} className="w-full">
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
              <input type="file" accept=".json" onChange={importConfig} className="hidden" />
            </label>
            <Button variant="outline" size="sm" onClick={copyCode} className="w-full">
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
          </div>
        </div>
      </div>

      {/* Center - Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b bg-white dark:bg-[#2B2B2B] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Physical Form Builder</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "edit" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("edit")}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant={viewMode === "preview" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("preview")}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Print Preview
            </Button>
            <span className="text-sm text-muted-foreground ml-4">
              {fields.length} field{fields.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Canvas or Preview */}
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
          <div className="flex-1 overflow-auto bg-[#F4F6F8] dark:bg-[#1E1E1E] p-6">
            <div
              ref={canvasRef}
              className="relative mx-auto bg-white dark:bg-[#2B2B2B] shadow-fluent-3"
              style={{
                width: `${canvasConfig.canvasWidth || 1200}px`,
                height: `${canvasConfig.canvasHeight || 1600}px`,
                minHeight: `${canvasConfig.canvasHeight || 1600}px`,
              }}
            >
            {/* Grid Overlay */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `linear-gradient(to right, #E1E4E8 1px, transparent 1px),
                    linear-gradient(to bottom, #E1E4E8 1px, transparent 1px)`,
                  backgroundSize: `${gridSize}px ${gridSize}px`,
                }}
              />
            )}

            {/* Sections */}
            {sections.map((section) => (
              <div
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
                  setSelectedSection(section.id)
                }}
                onMouseDown={(e) => handleSectionDragStart(e, section.id)}
              >
                <div className="w-full h-full p-4 flex items-center border-b-2 border-primary">
                  <h3 className="text-lg font-semibold">{section.title || "Section"}</h3>
                </div>
                {selectedSection === section.id && (
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-white dark:border-[#2B2B2B] rounded-full cursor-se-resize z-20"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      const section = sections.find((s) => s.id === selectedSection)
                      if (section) {
                        setResizingGroup(selectedSection)
                        setResizeStart({
                          x: e.clientX,
                          y: e.clientY,
                          width: section.width,
                          height: section.height,
                        })
                      }
                    }}
                  />
                )}
              </div>
            ))}

            {/* Groups */}
            {groups.map((group) => (
              <div
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
                  setSelectedGroup(group.id)
                }}
                onMouseDown={(e) => handleGroupDragStart(e, group.id)}
              >
                {/* Group Header */}
                <div className="w-full p-3 border-b border-[#E1E4E8] bg-[#F4F6F8] dark:bg-[#1E1E1E]">
                  <h4 className="text-sm font-semibold">{group.title || "Group"}</h4>
                  {group.description && (
                    <p className="text-xs text-muted-foreground mt-1">{group.description}</p>
                  )}
                </div>
                {/* Group Content */}
                <div
                  className="p-2 overflow-auto"
                  style={{ height: `${group.height - 60}px` }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const fieldId = e.dataTransfer.getData("text/plain")
                    if (fieldId && fieldId.startsWith("field-")) {
                      addFieldToGroup(fieldId, group.id)
                    }
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
                      <div
                        key={fieldId}
                        className="mb-2 p-2 border border-[#E1E4E8] rounded-xs bg-background cursor-pointer hover:bg-muted"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedField(fieldId)
                        }}
                      >
                        <div className="text-xs font-medium">{field.label}</div>
                      </div>
                    )
                  })}
                  {group.fields.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed border-[#E1E4E8] rounded-xs">
                      Drag fields here to add to group
                    </div>
                  )}
                </div>
                {/* Resize Handle */}
                {selectedGroup === group.id && (
                  <div
                    className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-white dark:border-[#2B2B2B] rounded-full cursor-se-resize z-20"
                    onMouseDown={(e) => {
                      e.stopPropagation()
                      setResizingGroup(group.id)
                      setResizeStart({
                        x: e.clientX,
                        y: e.clientY,
                        width: group.width,
                        height: group.height,
                      })
                    }}
                  />
                )}
              </div>
            ))}

            {/* Fields (not in groups) */}
            {fields
              .filter((field) => !field.groupId)
              .map((field) => (
                <div
                  key={field.id}
                  className={cn(
                    "absolute border-2 cursor-move transition-all",
                    selectedField === field.id
                      ? "border-primary shadow-fluent-2 z-10"
                      : "border-transparent hover:border-[#E1E4E8] z-0",
                    draggedField === field.id && "opacity-75"
                  )}
                  style={{
                    left: `${field.x}px`,
                    top: `${field.y}px`,
                    width: `${field.width}px`,
                    height: `${field.height}px`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedField(field.id)
                  }}
                  onMouseDown={(e) => handleFieldDragStart(e, field.id)}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", field.id)
                  }}
              >
                {/* Field Content Preview */}
                <div className="w-full h-full p-2 bg-white dark:bg-[#2B2B2B] rounded-xs">
                    {field.imageUrl ? (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 border border-[#E1E4E8] rounded-xs overflow-hidden">
                        <img
                          src={field.imageUrl}
                          alt={field.label || "Image"}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : field.lineDirection === "horizontal" ? (
                      <div
                        className="w-full h-full"
                        style={{
                          borderTop: `${field.borderWidth || 1}px ${field.borderStyle || "solid"} ${field.borderColor || "#1C1C1E"}`,
                        }}
                      />
                    ) : field.lineDirection === "vertical" ? (
                      <div
                        className="w-full h-full"
                        style={{
                          borderLeft: `${field.borderWidth || 1}px ${field.borderStyle || "solid"} ${field.borderColor || "#1C1C1E"}`,
                        }}
                      />
                    ) : field.borderStyle && field.borderStyle !== "none" ? (
                      <div
                        className="w-full h-full"
                        style={{
                          border: `${field.borderWidth || 1}px ${field.borderStyle || "solid"} ${field.borderColor || "#1C1C1E"}`,
                        }}
                      />
                    ) : field.type === "separator" ? (
                      <div className="w-full h-full border-t-2 border-[#E1E4E8] flex items-center">
                        {field.label && (
                          <span className="text-xs text-muted-foreground px-2">{field.label}</span>
                        )}
                      </div>
                    ) : field.type === "display-text" ? (
                      <div className="text-sm font-semibold">{field.label || "Display Text"}</div>
                    ) : (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-muted-foreground">{field.label}</div>
                        <div className="h-6 border border-[#E1E4E8] rounded-xs bg-background" />
                      </div>
                    )}
                  </div>

                  {/* Resize Handle */}
                  {selectedField === field.id && (
                    <div
                      className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary border-2 border-white dark:border-[#2B2B2B] rounded-full cursor-se-resize z-20"
                      onMouseDown={(e) => {
                        e.stopPropagation()
                        handleResizeStart(e, field.id, "se")
                      }}
                    />
                  )}
                </div>
              ))}

            {/* Canvas Click Handler */}
            <div
              className="absolute inset-0"
              onClick={() => {
                setSelectedField(null)
                setSelectedGroup(null)
                setSelectedSection(null)
              }}
            />
          </div>
        </div>
        )}
      </div>

      {/* Right Sidebar - Properties */}
      {(selectedFieldData || selectedGroup || selectedSection) && (
        <div className="w-80 border-l bg-white dark:bg-[#2B2B2B] p-4 overflow-y-auto">
          {selectedFieldData && (
            <>
              <h3 className="text-sm font-semibold mb-4">Field Properties</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-label" className="text-xs">Label</Label>
              <Input
                id="field-label"
                value={selectedFieldData.label}
                onChange={(e) => updateField(selectedField, { label: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-name" className="text-xs">Name</Label>
              <Input
                id="field-name"
                value={selectedFieldData.name}
                onChange={(e) => updateField(selectedField, { name: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            {/* Image URL Input */}
            {selectedFieldData.imageUrl !== undefined && (
              <div className="space-y-2">
                <Label htmlFor="field-image-url" className="text-xs">Image URL</Label>
                <Input
                  id="field-image-url"
                  type="url"
                  value={selectedFieldData.imageUrl || ""}
                  onChange={(e) => updateField(selectedField, { imageUrl: e.target.value })}
                  className="h-8 text-sm"
                  placeholder="https://example.com/logo.png"
                />
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = (event) => {
                          const result = event.target?.result
                          if (typeof result === "string") {
                            updateField(selectedField, { imageUrl: result })
                          }
                        }
                        reader.readAsDataURL(file)
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const input = document.createElement("input")
                      input.type = "file"
                      input.accept = "image/*"
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (file) {
                          const reader = new FileReader()
                          reader.onload = (event) => {
                            const result = event.target?.result
                            if (typeof result === "string") {
                              updateField(selectedField, { imageUrl: result })
                            }
                          }
                          reader.readAsDataURL(file)
                        }
                      }
                      input.click()
                    }}
                  >
                    Upload Image
                  </Button>
                </label>
              </div>
            )}

            {/* Border Properties */}
            {(selectedFieldData.borderStyle !== undefined || selectedFieldData.lineDirection) && (
              <div className="pt-4 border-t space-y-4">
                <h4 className="text-xs font-semibold">Border/Line Properties</h4>
                
                {selectedFieldData.borderStyle !== undefined && (
                  <div className="space-y-2">
                    <Label htmlFor="border-style" className="text-xs">Border Style</Label>
                    <select
                      id="border-style"
                      value={selectedFieldData.borderStyle || "solid"}
                      onChange={(e) => updateField(selectedField, { borderStyle: e.target.value as "solid" | "dashed" | "dotted" | "double" | "none" })}
                      className="w-full h-8 text-sm border border-[#E1E4E8] rounded-xs px-2"
                    >
                      <option value="solid">Solid</option>
                      <option value="dashed">Dashed</option>
                      <option value="dotted">Dotted</option>
                      <option value="double">Double</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="border-width" className="text-xs">Border Width (px)</Label>
                  <Input
                    id="border-width"
                    type="number"
                    min="0"
                    max="10"
                    value={selectedFieldData.borderWidth || 1}
                    onChange={(e) => updateField(selectedField, { borderWidth: parseInt(e.target.value, 10) || 1 })}
                    className="h-8 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="border-color" className="text-xs">Border Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="border-color"
                      type="color"
                      value={selectedFieldData.borderColor || "#1C1C1E"}
                      onChange={(e) => updateField(selectedField, { borderColor: e.target.value })}
                      className="h-8 w-16 p-1"
                    />
                    <Input
                      type="text"
                      value={selectedFieldData.borderColor || "#1C1C1E"}
                      onChange={(e) => updateField(selectedField, { borderColor: e.target.value })}
                      className="h-8 text-sm flex-1"
                      placeholder="#1C1C1E"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <h4 className="text-xs font-semibold mb-3">Position & Size</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="field-x" className="text-xs">X</Label>
                  <Input
                    id="field-x"
                    type="number"
                    value={selectedFieldData.x}
                    onChange={(e) =>
                      updateField(selectedField, { x: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="field-y" className="text-xs">Y</Label>
                  <Input
                    id="field-y"
                    type="number"
                    value={selectedFieldData.y}
                    onChange={(e) =>
                      updateField(selectedField, { y: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="field-width" className="text-xs">Width</Label>
                  <Input
                    id="field-width"
                    type="number"
                    value={selectedFieldData.width}
                    onChange={(e) =>
                      updateField(selectedField, { width: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="field-height" className="text-xs">Height</Label>
                  <Input
                    id="field-height"
                    type="number"
                    value={selectedFieldData.height}
                    onChange={(e) =>
                      updateField(selectedField, { height: snap(Number(e.target.value)) })
                    }
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {selectedFieldData.type !== "separator" && selectedFieldData.type !== "display-text" && (
              <div className="pt-4 border-t">
                <h4 className="text-xs font-semibold mb-3">Validation</h4>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedFieldData.validation?.required || false}
                    onChange={(e) =>
                      updateField(selectedField, {
                        validation: {
                          ...selectedFieldData.validation,
                          required: e.target.checked,
                        },
                      })
                    }
                    className="h-4 w-4 rounded-xs border border-[#E1E4E8]"
                  />
                  <span className="text-xs">Required</span>
                </label>
              </div>
            )}

            <div className="pt-4 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => removeField(selectedField)}
                className="w-full"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete Field
              </Button>
            </div>
          </div>
            </>
          )}

          {selectedGroup && (
            <>
              <h3 className="text-sm font-semibold mb-4">Group Properties</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="group-title" className="text-xs">Title</Label>
                  <Input
                    id="group-title"
                    value={groups.find((g) => g.id === selectedGroup)?.title || ""}
                    onChange={(e) =>
                      setGroups(
                        groups.map((g) =>
                          g.id === selectedGroup ? { ...g, title: e.target.value } : g
                        )
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="group-description" className="text-xs">Description</Label>
                  <Input
                    id="group-description"
                    value={groups.find((g) => g.id === selectedGroup)?.description || ""}
                    onChange={(e) =>
                      setGroups(
                        groups.map((g) =>
                          g.id === selectedGroup ? { ...g, description: e.target.value } : g
                        )
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="pt-4 border-t">
                  <h4 className="text-xs font-semibold mb-3">Position & Size</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="group-x" className="text-xs">X</Label>
                      <Input
                        id="group-x"
                        type="number"
                        value={groups.find((g) => g.id === selectedGroup)?.x || 0}
                        onChange={(e) =>
                          setGroups(
                            groups.map((g) =>
                              g.id === selectedGroup ? { ...g, x: snap(Number(e.target.value)) } : g
                            )
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="group-y" className="text-xs">Y</Label>
                      <Input
                        id="group-y"
                        type="number"
                        value={groups.find((g) => g.id === selectedGroup)?.y || 0}
                        onChange={(e) =>
                          setGroups(
                            groups.map((g) =>
                              g.id === selectedGroup ? { ...g, y: snap(Number(e.target.value)) } : g
                            )
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="group-width" className="text-xs">Width</Label>
                      <Input
                        id="group-width"
                        type="number"
                        value={groups.find((g) => g.id === selectedGroup)?.width || 0}
                        onChange={(e) =>
                          setGroups(
                            groups.map((g) =>
                              g.id === selectedGroup ? { ...g, width: snap(Number(e.target.value)) } : g
                            )
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="group-height" className="text-xs">Height</Label>
                      <Input
                        id="group-height"
                        type="number"
                        value={groups.find((g) => g.id === selectedGroup)?.height || 0}
                        onChange={(e) =>
                          setGroups(
                            groups.map((g) =>
                              g.id === selectedGroup ? { ...g, height: snap(Number(e.target.value)) } : g
                            )
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeGroup(selectedGroup)}
                    className="w-full"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete Group
                  </Button>
                </div>
              </div>
            </>
          )}

          {selectedSection && (
            <>
              <h3 className="text-sm font-semibold mb-4">Section Properties</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="section-title" className="text-xs">Title</Label>
                  <Input
                    id="section-title"
                    value={sections.find((s) => s.id === selectedSection)?.title || ""}
                    onChange={(e) =>
                      setSections(
                        sections.map((s) =>
                          s.id === selectedSection ? { ...s, title: e.target.value } : s
                        )
                      )
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div className="pt-4 border-t">
                  <h4 className="text-xs font-semibold mb-3">Position & Size</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="section-x" className="text-xs">X</Label>
                      <Input
                        id="section-x"
                        type="number"
                        value={sections.find((s) => s.id === selectedSection)?.x || 0}
                        onChange={(e) =>
                          setSections(
                            sections.map((s) =>
                              s.id === selectedSection ? { ...s, x: snap(Number(e.target.value)) } : s
                            )
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="section-y" className="text-xs">Y</Label>
                      <Input
                        id="section-y"
                        type="number"
                        value={sections.find((s) => s.id === selectedSection)?.y || 0}
                        onChange={(e) =>
                          setSections(
                            sections.map((s) =>
                              s.id === selectedSection ? { ...s, y: snap(Number(e.target.value)) } : s
                            )
                          )
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeSection(selectedSection)}
                    className="w-full"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete Section
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

