import { createFileRoute } from "@tanstack/react-router"
import { AlertCircle } from "lucide-react"
import { ProtectedRoute } from "@/components/security/ProtectedRoute"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PERMISSIONS } from "@health-v1/shared/constants/permissions"

export const Route = createFileRoute("/results")({
  component: ResultsComponent,
})

function ResultsComponent() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.RESULTS.VIEW} resource="results">
      <ResultsComponentInner />
    </ProtectedRoute>
  )
}

function ResultsComponentInner() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Results Review</h1>
        <p className="text-muted-foreground mt-2">
          Review lab, radiology, and other clinical results
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Results Pending Review
          </CardTitle>
          <CardDescription>Results requiring physician review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium">Patient: John Doe (MRN: 123456)</p>
                  <p className="text-sm text-muted-foreground">Complete Blood Count - Abnormal</p>
                </div>
                <Badge variant="destructive">Critical</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
