import { createFileRoute } from "@tanstack/react-router"
import { Calendar, Plus } from "lucide-react"
import { ProtectedRoute } from "@/components/security/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PERMISSIONS } from "@health-v1/shared/constants/permissions"

export const Route = createFileRoute("/scheduling")({
  component: SchedulingComponent,
})

function SchedulingComponent() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.SCHEDULING.VIEW} resource="scheduling">
      <SchedulingComponentInner />
    </ProtectedRoute>
  )
}

function SchedulingComponentInner() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scheduling</h1>
          <p className="text-muted-foreground mt-2">Manage appointments and resource scheduling</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Appointment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
          <CardDescription>Appointments for today</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No appointments scheduled for today.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
