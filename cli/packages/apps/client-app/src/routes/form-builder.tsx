import { createFileRoute } from "@tanstack/react-router"
import { FileText, Layout } from "lucide-react"
import { useState } from "react"
import { FormCanvasBuilder } from "@/components/forms/canvas"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { FormPlaygroundWithResizer } from "@/components/ui/form-playground-with-resizer"
import { Stack } from "@/components/ui/stack"

export const Route = createFileRoute("/form-builder")({
  component: FormBuilderPage,
})

function FormBuilderPage() {
  const [builderType, setBuilderType] = useState<"canvas" | "ui">("ui")

  return (
    <Flex direction="column" className="h-screen">
      {/* Builder Type Selector */}
      <Box className="border-b bg-white">
        <Stack spacing="xs">
          <Flex className="items-center gap-2">
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
          </Flex>
          <p className="text-xs text-muted-foreground">
            {builderType === "ui"
              ? "Build responsive web forms with grid layout and modern UI components"
              : "Design physical/print-ready forms with absolute positioning and sheet sizes"}
          </p>
        </Stack>
      </Box>

      {/* Builder Content */}
      <Box className="flex-1 overflow-hidden">
        {builderType === "canvas" ? <FormCanvasBuilder /> : <FormPlaygroundWithResizer />}
      </Box>
    </Flex>
  )
}
