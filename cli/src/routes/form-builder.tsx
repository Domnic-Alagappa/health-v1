import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { FileText, Layout } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FormCanvasBuilder } from "@/components/ui/form-canvas-builder"
import { FormPlaygroundWithResizer } from "@/components/ui/form-playground-with-resizer"

export const Route = createFileRoute("/form-builder")({
  component: FormBuilderPage,
})

function FormBuilderPage() {
  const [builderType, setBuilderType] = useState<"canvas" | "ui">("ui")

  return (
    <div className="h-screen flex flex-col">
      {/* Builder Type Selector */}
      <div className="border-b bg-white dark:bg-[#2B2B2B] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium mr-4">Form Builder Type:</span>
          <Button
            variant={builderType === "ui" ? "default" : "outline"}
            size="sm"
            onClick={() => setBuilderType("ui")}
            className="gap-2"
          >
            <Layout className="h-4 w-4" />
            UI Form Builder
          </Button>
          <Button
            variant={builderType === "canvas" ? "default" : "outline"}
            size="sm"
            onClick={() => setBuilderType("canvas")}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            Physical Form Builder
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {builderType === "ui"
            ? "Build responsive web forms with grid layout and modern UI components"
            : "Design physical/print-ready forms with absolute positioning and sheet sizes"}
        </p>
      </div>

      {/* Builder Content */}
      <div className="flex-1 overflow-hidden">
        {builderType === "canvas" ? (
          <FormCanvasBuilder />
        ) : (
          <FormPlaygroundWithResizer />
        )}
      </div>
    </div>
  )
}
