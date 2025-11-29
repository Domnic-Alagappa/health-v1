import { createFileRoute } from "@tanstack/react-router"
import { Activity, Calendar, FileText, Pill } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export const Route = createFileRoute("/patients/$patientId")({
  component: PatientDetailComponent,
})

function PatientDetailComponent() {
  const { patientId } = Route.useParams()

  // Mock patient data
  const patient = {
    id: patientId,
    name: "John Doe",
    mrn: "MRN-123456",
    dob: "1985-05-15",
    age: 39,
    gender: "Male",
    status: "Active",
    primaryCare: "Dr. Jane Smith",
    lastVisit: "2024-01-10",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{patient.name}</h1>
          <p className="text-muted-foreground mt-1">
            MRN: {patient.mrn} | DOB: {patient.dob} | Age: {patient.age}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{patient.status}</Badge>
          <Button variant="outline">Actions</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Patient Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{patient.gender}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Primary Care</p>
                <p className="font-medium">{patient.primaryCare}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Visit</p>
                <p className="font-medium">{patient.lastVisit}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 h-4 w-4" />
              New Note
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Activity className="mr-2 h-4 w-4" />
              View Results
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Pill className="mr-2 h-4 w-4" />
              Medications
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>No recent activity found.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
