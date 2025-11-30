import {
  Check,
  Code,
  Copy,
  Download,
  Eye,
  Grid3x3,
  GripVertical,
  Maximize2,
  Move,
  Plus,
  Settings,
  Trash2,
  Upload,
} from "lucide-react"
import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Card, CardContent, CardHeader, CardTitle } from "./card"
import { type FieldType, FormBuilder, type FormConfig, type FormField } from "./form-builder"
import { Input } from "./input"
import { Label } from "./label"

/**
 * Enhanced Form Builder with Drag & Drop, Resizers, and Visual Placement
 * Features:
 * - Drag and drop field reordering
 * - Visual column span resizer
 * - Grid overlay for placement
 * - Real-time preview
 */
export function FormPlaygroundWithResizer() {
  const [fields, setFields] = React.useState<FormField[]>([])
  const [selectedField, setSelectedField] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<"edit" | "code" | "preview">("edit")
  const [draggedField, setDraggedField] = React.useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)
  const [showGrid, setShowGrid] = React.useState(false)
  const [resizingField, setResizingField] = React.useState<string | null>(null)
  const [resizeStartX, setResizeStartX] = React.useState(0)
  const [resizeStartColSpan, setResizeStartColSpan] = React.useState(12)
  const [formConfig, setFormConfig] = React.useState<Partial<FormConfig>>({
    id: "form-1",
    title: "New Form",
    description: "Build your form by adding fields",
    layout: "two-column",
    gap: "md",
  })
  const [copied, setCopied] = React.useState(false)

  // Field categories
  const fieldCategories = {
    "Field Elements": [
      { type: "text" as FieldType, label: "Input", icon: "📝" },
      { type: "textarea" as FieldType, label: "Textarea", icon: "📄" },
      { type: "password" as FieldType, label: "Password", icon: "🔒" },
      { type: "email" as FieldType, label: "Email", icon: "✉️" },
      { type: "number" as FieldType, label: "Number", icon: "🔢" },
      { type: "tel" as FieldType, label: "Phone", icon: "📞" },
      { type: "date" as FieldType, label: "Date", icon: "📅" },
      { type: "select" as FieldType, label: "Select", icon: "📋" },
      { type: "checkbox" as FieldType, label: "Checkbox", icon: "☐" },
      { type: "radio" as FieldType, label: "Radio", icon: "🔘" },
      { type: "file" as FieldType, label: "File", icon: "📎" },
    ],
    "Display Elements": [
      { type: "display-text" as FieldType, label: "Text", icon: "📝" },
      { type: "separator" as FieldType, label: "Separator", icon: "➖" },
    ],
  }

  // Add new field
  const addField = (type: FieldType) => {
    const fieldDefaults: Record<FieldType, Partial<FormField>> = {
      text: { placeholder: "Enter text..." },
      email: { placeholder: "Enter email..." },
      number: { placeholder: "Enter number..." },
      tel: { placeholder: "Enter phone..." },
      url: { placeholder: "Enter URL..." },
      password: { placeholder: "Enter password..." },
      textarea: { placeholder: "Enter text..." },
      select: { options: [{ label: "Option 1", value: "option1" }] },
      checkbox: {},
      radio: { options: [{ label: "Option 1", value: "option1" }] },
      date: {},
      "datetime-local": {},
      time: {},
      file: {},
      multiselect: { options: [{ label: "Option 1", value: "option1" }] },
      switch: {},
      toggle: {},
      slider: {},
      rating: {},
      "input-otp": {},
      combobox: { options: [{ label: "Option 1", value: "option1" }] },
      "display-text": { label: "Display Text", description: "This is a text element" },
      separator: { label: "" },
    }

    const newField: FormField = {
      id: `field-${Date.now()}`,
      name: `field${fields.length + 1}`,
      label:
        type === "separator"
          ? ""
          : type === "display-text"
            ? "Display Text"
            : `Field ${fields.length + 1}`,
      type,
      ...fieldDefaults[type],
      layout: {
        colSpan: type === "separator" || type === "display-text" ? 12 : 12,
        size: "md",
      },
    }
    setFields([...fields, newField])
    setSelectedField(newField.id)
  }

  // Remove field
  const removeField = (fieldId: string) => {
    setFields(fields.filter((f) => f.id !== fieldId))
    if (selectedField === fieldId) {
      setSelectedField(null)
    }
  }

  // Update field
  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)))
  }

  // Duplicate field
  const duplicateField = (fieldId: string) => {
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return
    const newField: FormField = {
      ...field,
      id: `field-${Date.now()}`,
      name: `${field.name}_copy`,
      label: `${field.label} (Copy)`,
    }
    const index = fields.findIndex((f) => f.id === fieldId)
    const newFields = [...fields]
    newFields.splice(index + 1, 0, newField)
    setFields(newFields)
    setSelectedField(newField.id)
  }

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedField(fieldId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", fieldId)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggedField) return

    const draggedIndex = fields.findIndex((f) => f.id === draggedField)
    if (draggedIndex === -1) return

    const newFields = [...fields]
    const [removed] = newFields.splice(draggedIndex, 1)
    newFields.splice(dropIndex, 0, removed!)

    setFields(newFields)
    setDraggedField(null)
    setDragOverIndex(null)
  }

  // Resize handlers
  const handleResizeStart = (e: React.MouseEvent, fieldId: string) => {
    e.preventDefault()
    e.stopPropagation()
    const field = fields.find((f) => f.id === fieldId)
    if (!field) return

    setResizingField(fieldId)
    setResizeStartX(e.clientX)
    setResizeStartColSpan(field.layout?.colSpan || 12)

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!resizingField) return
      const deltaX = moveEvent.clientX - resizeStartX
      const pixelsPerColumn = 50 // Approximate pixels per column
      const columnDelta = Math.round(deltaX / pixelsPerColumn)
      const newColSpan = Math.max(1, Math.min(12, resizeStartColSpan + columnDelta))

      updateField(fieldId, {
        layout: {
          ...field.layout,
          colSpan: newColSpan as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
        },
      })
    }

    const handleMouseUp = () => {
      setResizingField(null)
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
  }

  // Export/Import
  const exportConfig = () => {
    const config: FormConfig = {
      id: formConfig.id || "form-1",
      ...formConfig,
      fields,
    }
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${config.id}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importConfig = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const config = JSON.parse(e.target?.result as string) as FormConfig
        setFormConfig(config)
        setFields(config.fields)
      } catch (error) {
        console.error("Error importing config:", error)
        alert("Error importing form config. Please check the file format.")
      }
    }
    reader.readAsText(file)
  }

  // Generate code
  const generateCode = () => {
    const config: FormConfig = {
      id: formConfig.id || "form-1",
      ...formConfig,
      fields,
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
      {/* Left Sidebar */}
      <div className="w-72 border-r bg-[#F4F6F8]">
        <div className="space-y-6">
          {/* Form Settings */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Form Settings
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="form-title" className="text-xs mb-1.5 block">
                  Title
                </Label>
                <Input
                  id="form-title"
                  value={formConfig.title || ""}
                  onChange={(e) => setFormConfig({ ...formConfig, title: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="form-layout" className="text-xs mb-1.5 block">
                  Layout
                </Label>
                <select
                  id="form-layout"
                  value={formConfig.layout || "two-column"}
                  onChange={(e) =>
                    setFormConfig({
                      ...formConfig,
                      layout: e.target.value as FormConfig["layout"],
                    })
                  }
                  className="flex h-8 w-full rounded-xs border border-[#E1E4E8] bg-background px-3 text-sm"
                >
                  <option value="single">Single Column</option>
                  <option value="two-column">Two Columns</option>
                  <option value="three-column">Three Columns</option>
                  <option value="four-column">Four Columns</option>
                </select>
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
          </div>
        </div>
      </div>

      {/* Center - Main Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b bg-white">
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === "edit" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("edit")}
            >
              <Settings className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              variant={activeTab === "code" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("code")}
            >
              <Code className="h-4 w-4 mr-1" />
              Code
            </Button>
            <Button
              variant={activeTab === "preview" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("preview")}
            >
              <Eye className="h-4 w-4 mr-1" />
              Preview
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {fields.length} field{fields.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F4F6F8]">
          {showGrid && (
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="grid grid-cols-12 gap-4 h-full p-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="border border-dashed border-primary/30" />
                ))}
              </div>
            </div>
          )}

          {activeTab === "edit" && (
            <Card className="max-w-5xl mx-auto relative">
              <CardContent className="p-6">
                {fields.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <p className="text-lg font-medium mb-2">No fields yet</p>
                    <p className="text-sm">Add fields from the sidebar to start building</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const colSpan = field.layout?.colSpan || 12
                      const colWidth = (colSpan / 12) * 100

                      return (
                        <div
                          key={field.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, field.id)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          className={cn(
                            "group relative rounded-md border-2 transition-all cursor-move",
                            selectedField === field.id
                              ? "border-primary bg-primary/5 shadow-fluent-1"
                              : "border-transparent hover:border-[#E1E4E8] bg-white",
                            draggedField === field.id && "opacity-50",
                            dragOverIndex === index && "border-primary border-dashed"
                          )}
                          onClick={() => setSelectedField(field.id)}
                          style={{
                            width: `${colWidth}%`,
                            minWidth: "200px",
                          }}
                        >
                          {/* Drag Handle */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-primary cursor-grab active:cursor-grabbing" />

                          {/* Resize Handle */}
                          <div
                            className="absolute right-0 top-0 bottom-0 w-2 bg-transparent group-hover:bg-primary/20 cursor-ew-resize flex items-center justify-center"
                            onMouseDown={(e) => handleResizeStart(e, field.id)}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="w-0.5 h-full bg-primary opacity-0 group-hover:opacity-100" />
                          </div>

                          <div className="p-4 pr-6">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2 flex-1">
                                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">
                                      {field.label || "(No label)"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      ({field.type})
                                    </span>
                                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                      {colSpan}/12
                                    </span>
                                  </div>
                                  {(field.description || field.placeholder) && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {field.description || field.placeholder}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    duplicateField(field.id)
                                  }}
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    removeField(field.id)
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "code" && (
            <Card className="max-w-5xl mx-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Generated Code</CardTitle>
                <Button variant="outline" size="sm" onClick={copyCode}>
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="bg-[#F4F6F8]">
                  <code>{generateCode()}</code>
                </pre>
              </CardContent>
            </Card>
          )}

          {activeTab === "preview" && (
            <Card className="max-w-5xl mx-auto">
              <CardContent className="p-6">
                <FormBuilder
                  config={
                    {
                      id: "preview-form",
                      ...formConfig,
                      fields,
                    } as FormConfig
                  }
                  onSubmit={(data) => {
                    console.log("Form submitted:", data)
                    alert("Form submitted! Check console.")
                  }}
                  onCancel={() => setActiveTab("edit")}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Right Sidebar - Field Properties */}
      {selectedFieldData && activeTab === "edit" && (
        <div className="w-80 border-l bg-white">
          <h3 className="text-sm font-semibold mb-4">Field Properties</h3>
          <div className="space-y-4">
            {/* Basic Properties */}
            <div className="space-y-2">
              <Label htmlFor="field-label" className="text-xs">
                Label
              </Label>
              <Input
                id="field-label"
                value={selectedFieldData.label}
                onChange={(e) => updateField(selectedField, { label: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-name" className="text-xs">
                Name
              </Label>
              <Input
                id="field-name"
                value={selectedFieldData.name}
                onChange={(e) => updateField(selectedField, { name: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            {/* Column Span Slider */}
            <div className="pt-4 border-t">
              <h4 className="text-xs font-semibold mb-3">Layout & Sizing</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="field-colspan" className="text-xs">
                      Column Span
                    </Label>
                    <span className="text-xs font-medium text-primary">
                      {selectedFieldData.layout?.colSpan || 12}/12
                    </span>
                  </div>
                  <input
                    type="range"
                    id="field-colspan"
                    min="1"
                    max="12"
                    value={selectedFieldData.layout?.colSpan || 12}
                    onChange={(e) =>
                      updateField(selectedField, {
                        layout: {
                          ...selectedFieldData.layout,
                          colSpan: Number(e.target.value) as
                            | 1
                            | 2
                            | 3
                            | 4
                            | 5
                            | 6
                            | 7
                            | 8
                            | 9
                            | 10
                            | 11
                            | 12,
                        },
                      })
                    }
                    className="w-full h-2 bg-[#E1E4E8] rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>1</span>
                    <span>6</span>
                    <span>12</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field-size" className="text-xs">
                    Size
                  </Label>
                  <select
                    id="field-size"
                    value={selectedFieldData.layout?.size || "md"}
                    onChange={(e) =>
                      updateField(selectedField, {
                        layout: {
                          ...selectedFieldData.layout,
                          size: e.target.value as "sm" | "md" | "lg" | "xl",
                        },
                      })
                    }
                    className="flex h-8 w-full rounded-xs border border-[#E1E4E8] bg-background px-3 text-sm"
                  >
                    <option value="sm">Small</option>
                    <option value="md">Medium</option>
                    <option value="lg">Large</option>
                    <option value="xl">Extra Large</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Column Presets */}
            <div className="pt-2">
              <Label className="text-xs mb-2 block">Quick Presets</Label>
              <div className="grid grid-cols-4 gap-2">
                {[3, 6, 9, 12].map((cols) => (
                  <Button
                    key={cols}
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() =>
                      updateField(selectedField, {
                        layout: {
                          ...selectedFieldData.layout,
                          colSpan: cols as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
                        },
                      })
                    }
                  >
                    {cols}/12
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
