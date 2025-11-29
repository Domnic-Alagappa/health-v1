import { useState } from "react"
import type {
  CanvasField,
  CanvasFormConfig,
  CanvasGroup,
  CanvasSection,
} from "@/components/forms/canvas/types"
import type { FieldType } from "@/components/ui/form-builder"
import {
  createCanvasField,
  createCanvasGroup,
  createCanvasSection,
  exportCanvasConfig,
  generateFormCode,
} from "@/lib/canvasFieldUtils"

interface UseCanvasOperationsOptions {
  fields: CanvasField[]
  groups: CanvasGroup[]
  sections: CanvasSection[]
  canvasConfig: CanvasFormConfig
  setFields: React.Dispatch<React.SetStateAction<CanvasField[]>>
  setGroups: React.Dispatch<React.SetStateAction<CanvasGroup[]>>
  setSections: React.Dispatch<React.SetStateAction<CanvasSection[]>>
  setCanvasConfig: React.Dispatch<React.SetStateAction<CanvasFormConfig>>
  setSelectedField: (id: string | null) => void
  setSelectedGroup: (id: string | null) => void
  setSelectedSection: (id: string | null) => void
}

export function useCanvasOperations({
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
}: UseCanvasOperationsOptions) {
  const [copied, setCopied] = useState(false)

  const addField = (
    type: FieldType | "group" | "section" | "image" | "line-horizontal" | "line-vertical" | "box"
  ) => {
    if (type === "group") {
      const newGroup = createCanvasGroup(groups.length)
      setGroups([...groups, newGroup])
      setSelectedGroup(newGroup.id)
      return
    }

    if (type === "section") {
      const newSection = createCanvasSection(sections.length, canvasConfig.canvasWidth)
      setSections([...sections, newSection])
      setSelectedSection(newSection.id)
      return
    }

    const newField = createCanvasField(type, fields.length, canvasConfig.canvasWidth)
    setFields([...fields, newField])
    setSelectedField(newField.id)
  }

  const exportConfig = () => {
    const config = exportCanvasConfig(fields, canvasConfig)
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
        const config = JSON.parse(e.target?.result as string)
        const canvasFields = config.fields.map((field: any, index: number) => ({
          ...field,
          x: 50 + (index % 5) * 200,
          y: 50 + Math.floor(index / 5) * 100,
          width: (field.layout?.colSpan || 6) * 100,
          height: field.type === "textarea" ? 100 : 40,
        }))
        setFields(canvasFields)
        setCanvasConfig({ ...canvasConfig, ...config })
      } catch (error) {
        console.error("Error importing config:", error)
        alert("Error importing form config.")
      }
    }
    reader.readAsText(file)
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(generateFormCode(fields, canvasConfig))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  return {
    copied,
    addField,
    exportConfig,
    importConfig,
    copyCode,
  }
}
