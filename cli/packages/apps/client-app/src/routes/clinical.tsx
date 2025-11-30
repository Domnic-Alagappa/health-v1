import { createFileRoute } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { ProtectedRoute } from "@/components/security/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PERMISSIONS } from "@/lib/constants/permissions"

export const Route = createFileRoute("/clinical")({
  component: ClinicalComponent,
})

function ClinicalComponent() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.CLINICAL.VIEW} resource="clinical">
      <ClinicalComponentInner />
    </ProtectedRoute>
  )
}

function ClinicalComponentInner() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clinical Documentation</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage clinical notes, H&P, discharge summaries, and more
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Documentation Templates</CardTitle>
          <CardDescription>Select a template to create documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">Progress Note</CardTitle>
                <CardDescription>Daily progress documentation</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">History & Physical</CardTitle>
                <CardDescription>Initial patient assessment</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">Discharge Summary</CardTitle>
                <CardDescription>Patient discharge documentation</CardDescription>
              </CardHeader>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-base">Operative Report</CardTitle>
                <CardDescription>Procedure documentation</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
