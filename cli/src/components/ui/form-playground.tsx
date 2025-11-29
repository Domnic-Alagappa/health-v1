import * as React from "react"
import { Plus, Trash2, GripVertical, Eye, Code, Save, Download, Upload } from "lucide-react"
import { Button } from "./button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./dialog"
import { Input } from "./input"
import { Label } from "./label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { FormBuilder, FormConfig, FormField, FieldType } from "./form-builder"
import { cn } from "@/lib/utils"

/**
 * Visual Form Builder Playground
 * Drag-and-drop interface for building forms with live preview
 */
export function FormPlayground() {
  const [fields, setFields] = React.useState<FormField[]>([])
  const [selectedField, setSelectedField] = React.useState<string | null>(null)
  const [previewMode, setPreviewMode] = React.useState(false)
  const [formConfig, setFormConfig] = React.useState<Partial<FormConfig>>({
    title: "New Form",
    description: "Build your form by adding fields",
    layout: "two-column",
    gap: "md",
  })

  // Add new field
  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      name: `field${fields.length + 1}`,
      label: `Field ${fields.length + 1}`,
      type,
      placeholder: `Enter ${type}...`,
      layout: {
        colSpan: 12,
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

  // Move field
  const moveField = (fromIndex: number, toIndex: number) => {
    const newFields = [...fields]
    const [moved] = newFields.splice(fromIndex, 1)
    newFields.splice(toIndex, 0, moved!)
    setFields(newFields)
  }

  // Export form config
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

  // Import form config
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
      }
    }
    reader.readAsText(file)
  }

  const selectedFieldData = fields.find((f) => f.id === selectedField)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Sidebar - Field Library */}
      <div className="w-64 border-r bg-[#F4F6F8] dark:bg-[#1E1E1E] p-4 overflow-y-auto">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Form Settings</h3>
            <div className="space-y-2">
              <div>
                <Label htmlFor="form-title" className="text-xs">Title</Label>
                <Input
                  id="form-title"
                  value={formConfig.title || ""}
                  onChange={(e) => setFormConfig({ ...formConfig, title: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="form-description" className="text-xs">Description</Label>
                <Input
                  id="form-description"
                  value={formConfig.description || ""}
                  onChange={(e) => setFormConfig({ ...formConfig, description: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Add Fields</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { type: "text" as FieldType, label: "Text" },
                { type: "email" as FieldType, label: "Email" },
                { type: "number" as FieldType, label: "Number" },
                { type: "tel" as FieldType, label: "Phone" },
                { type: "date" as FieldType, label: "Date" },
                { type: "textarea" as FieldType, label: "Textarea" },
                { type: "select" as FieldType, label: "Select" },
                { type: "checkbox" as FieldType, label: "Checkbox" },
                { type: "radio" as FieldType, label: "Radio" },
                { type: "file" as FieldType, label: "File" },
              ].map(({ type, label }) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs"
                  onClick={() => addField(type)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportConfig} className="flex-1">
                <Download className="h-3 w-3 mr-1" />
                Export
              </Button>
              <label className="flex-1">
                <Button variant="outline" size="sm" asChild className="w-full">
                  <span>
                    <Upload className="h-3 w-3 mr-1" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={importConfig}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Center - Form Builder Canvas */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="border-b bg-white dark:bg-[#2B2B2B] px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant={previewMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              <Eye className="h-4 w-4 mr-1" />
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button variant="outline" size="sm">
              <Code className="h-4 w-4 mr-1" />
              Code
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {fields.length} field{fields.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#F4F6F8] dark:bg-[#1E1E1E]">
          {previewMode ? (
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-6">
                <FormBuilder
                  config={{
                    id: "preview-form",
                    ...formConfig,
                    fields,
                  } as FormConfig}
                  onSubmit={(data) => {
                    console.log("Form submitted:", data)
                    alert("Form submitted! Check console.")
                  }}
                  onCancel={() => setPreviewMode(false)}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="max-w-4xl mx-auto">
              <CardContent className="p-6">
                {fields.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p className="text-lg mb-2">No fields yet</p>
                    <p className="text-sm">Add fields from the sidebar to start building your form</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className={cn(
                          "group relative p-4 rounded-md border-2 transition-all",
                          selectedField === field.id
                            ? "border-primary bg-primary/5"
                            : "border-transparent hover:border-[#E1E4E8] bg-white dark:bg-[#2B2B2B]"
                        )}
                        onClick={() => setSelectedField(field.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                            <span className="text-sm font-medium">{field.label}</span>
                            <span className="text-xs text-muted-foreground">({field.type})</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeField(field.id)
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {field.description || field.placeholder || "No description"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Right Sidebar - Field Properties */}
      {selectedFieldData && !previewMode && (
        <div className="w-80 border-l bg-white dark:bg-[#2B2B2B] p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold mb-4">Field Properties</h3>
          <div className="space-y-4">
            {/* Basic Properties */}
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

            <div className="space-y-2">
              <Label htmlFor="field-placeholder" className="text-xs">Placeholder</Label>
              <Input
                id="field-placeholder"
                value={selectedFieldData.placeholder || ""}
                onChange={(e) => updateField(selectedField, { placeholder: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-description" className="text-xs">Description</Label>
              <Input
                id="field-description"
                value={selectedFieldData.description || ""}
                onChange={(e) => updateField(selectedField, { description: e.target.value })}
                className="h-8 text-sm"
              />
            </div>

            {/* Layout Properties */}
            <div className="pt-4 border-t">
              <h4 className="text-xs font-semibold mb-3">Layout & Sizing</h4>
              
              <div className="space-y-2">
                <Label htmlFor="field-colspan" className="text-xs">Column Span</Label>
                <select
                  id="field-colspan"
                  value={selectedFieldData.layout?.colSpan || 12}
                  onChange={(e) =>
                    updateField(selectedField, {
                      layout: {
                        ...selectedFieldData.layout,
                        colSpan: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
                      },
                    })
                  }
                  className="flex h-8 w-full rounded-xs border border-[#E1E4E8] bg-background px-3 text-sm"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <option key={num} value={num}>
                      {num} column{num !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="field-size" className="text-xs">Size</Label>
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

              <div className="space-y-2">
                <Label htmlFor="field-width" className="text-xs">Width</Label>
                <select
                  id="field-width"
                  value={selectedFieldData.layout?.width || "full"}
                  onChange={(e) =>
                    updateField(selectedField, {
                      layout: {
                        ...selectedFieldData.layout,
                        width: e.target.value as "auto" | "full" | "half" | "third" | "quarter",
                      },
                    })
                  }
                  className="flex h-8 w-full rounded-xs border border-[#E1E4E8] bg-background px-3 text-sm"
                >
                  <option value="full">Full Width</option>
                  <option value="half">Half Width</option>
                  <option value="third">Third Width</option>
                  <option value="quarter">Quarter Width</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>

            {/* Validation */}
            <div className="pt-4 border-t">
              <h4 className="text-xs font-semibold mb-3">Validation</h4>
              <div className="space-y-2">
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

