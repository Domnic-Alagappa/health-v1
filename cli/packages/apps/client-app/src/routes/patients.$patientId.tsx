import { createFileRoute } from "@tanstack/react-router"
import { Activity, Calendar, FileText, Pill } from "lucide-react"
import { useEffect, useRef } from "react"
import { ProtectedRoute } from "@/components/security/ProtectedRoute"
import { Badge } from "@/components/ui/badge"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { registerComponent } from "@/components/ui/component-registry"
import { PERMISSIONS } from "@health-v1/shared/constants/permissions"

export const Route = createFileRoute("/patients/$patientId")({
  component: PatientDetailComponent,
})

function PatientDetailComponent() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.PATIENTS.VIEW} resource="patients">
      <PatientDetailComponentInner />
    </ProtectedRoute>
  )
}

function PatientDetailComponentInner() {
  const { patientId } = Route.useParams()
  const newNoteButtonRef = useRef<HTMLButtonElement>(null)
  const scheduleButtonRef = useRef<HTMLButtonElement>(null)
  const viewResultsButtonRef = useRef<HTMLButtonElement>(null)
  const medicationsButtonRef = useRef<HTMLButtonElement>(null)

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

  // Register patient detail page with component registry for voice commands
  useEffect(() => {
    const componentId = `patient-detail-${patientId}`

    registerComponent(componentId, {
      ariaLabel: `Patient Detail: ${patient.name}`,
      i18nKey: "patient.detail",
      voiceInteractable: true,
      voiceDescription: `Patient detail page for ${patient.name}, Medical Record Number ${patient.mrn}`,

      componentStructure: {
        type: "card",
        sections: [
          {
            id: "overview",
            label: "Patient Overview",
            content: `Patient ${patient.name}, ${patient.age} years old, ${patient.gender}`,
          },
          {
            id: "quick-actions",
            label: "Quick Actions",
            content: "Available actions: New Note, Schedule, View Results, Medications",
          },
        ],
        dataPoints: [
          { id: "name", label: "Name", value: patient.name },
          { id: "mrn", label: "MRN", value: patient.mrn },
          { id: "dob", label: "Date of Birth", value: patient.dob },
          { id: "age", label: "Age", value: String(patient.age) },
          { id: "gender", label: "Gender", value: patient.gender },
          { id: "status", label: "Status", value: patient.status },
          { id: "primaryCare", label: "Primary Care", value: patient.primaryCare },
          { id: "lastVisit", label: "Last Visit", value: patient.lastVisit },
        ],
      },

      actionItems: [
        {
          id: "new-note",
          label: "New Note",
          voiceCommand: ["new note", "create note", "add note", "write note"],
          action: () => {
            newNoteButtonRef.current?.click()
          },
          i18nKey: "actions.newNote",
        },
        {
          id: "schedule",
          label: "Schedule Appointment",
          voiceCommand: ["schedule", "schedule appointment", "book appointment"],
          action: () => {
            scheduleButtonRef.current?.click()
          },
          i18nKey: "actions.schedule",
        },
        {
          id: "view-results",
          label: "View Results",
          voiceCommand: ["view results", "show results", "results"],
          action: () => {
            viewResultsButtonRef.current?.click()
          },
          i18nKey: "actions.viewResults",
        },
        {
          id: "medications",
          label: "Medications",
          voiceCommand: ["medications", "show medications", "view medications"],
          action: () => {
            medicationsButtonRef.current?.click()
          },
          i18nKey: "actions.medications",
        },
      ],
    })

    return () => {
      // Component registry cleanup would go here if we had an unregister function
    }
  }, [
    patientId,
    patient.name,
    patient.mrn,
    patient.age,
    patient.gender,
    patient.status,
    patient.primaryCare,
    patient.dob,
    patient.lastVisit,
  ])

  return (
    <Box className="space-y-6" role="main" aria-label={`Patient detail for ${patient.name}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" aria-label={`Patient name: ${patient.name}`}>
            {patient.name}
          </h1>
          <p className="text-muted-foreground mt-1">
            MRN: {patient.mrn} | DOB: {patient.dob} | Age: {patient.age}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="secondary">{patient.status}</Badge>
          <Button variant="outline" aria-label="Patient actions menu">
            Actions
          </Button>
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
            <Button
              ref={newNoteButtonRef}
              variant="outline"
              className="w-full justify-start"
              aria-label="Create new clinical note"
              onClick={() => {
                // In a real app, this would open a note creation form
                console.log("New note clicked")
              }}
            >
              <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
              New Note
            </Button>
            <Button
              ref={scheduleButtonRef}
              variant="outline"
              className="w-full justify-start"
              aria-label="Schedule appointment"
              onClick={() => {
                console.log("Schedule clicked")
              }}
            >
              <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
              Schedule
            </Button>
            <Button
              ref={viewResultsButtonRef}
              variant="outline"
              className="w-full justify-start"
              aria-label="View test results"
              onClick={() => {
                console.log("View results clicked")
              }}
            >
              <Activity className="mr-2 h-4 w-4" aria-hidden="true" />
              View Results
            </Button>
            <Button
              ref={medicationsButtonRef}
              variant="outline"
              className="w-full justify-start"
              aria-label="View medications"
              onClick={() => {
                console.log("Medications clicked")
              }}
            >
              <Pill className="mr-2 h-4 w-4" aria-hidden="true" />
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
    </Box>
  )
}
