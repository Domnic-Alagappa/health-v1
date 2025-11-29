import { createFileRoute } from "@tanstack/react-router"
import { ArrowRight, Filter, Plus, Search, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTabs } from "@/contexts/TabContext"

export const Route = createFileRoute("/patients")({
  component: PatientsComponent,
})

function PatientsComponent() {
  const { openTab } = useTabs()

  // Mock patient data
  const patients = [
    {
      id: "123456",
      name: "John Doe",
      mrn: "MRN-123456",
      dob: "1985-05-15",
      age: 39,
      status: "Active",
      lastVisit: "2024-01-10",
    },
    {
      id: "789012",
      name: "Jane Smith",
      mrn: "MRN-789012",
      dob: "1990-08-22",
      age: 33,
      status: "Active",
      lastVisit: "2024-01-08",
    },
    {
      id: "345678",
      name: "Robert Johnson",
      mrn: "MRN-345678",
      dob: "1975-12-03",
      age: 48,
      status: "Active",
      lastVisit: "2023-12-20",
    },
  ]

  const handleOpenPatient = (patient: (typeof patients)[0]) => {
    openTab({
      label: `${patient.name} (${patient.mrn})`,
      path: `/patients/${patient.id}`,
      icon: <Users className="h-4 w-4" />,
      closable: true,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Patient Management</h1>
          <p className="text-muted-foreground mt-2">Search, view, and manage patient records</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Register New Patient
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Search</CardTitle>
          <CardDescription>Search by name, MRN, DOB, or SSN</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search patients..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button>Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {patients.map((patient) => (
              <div
                key={patient.id}
                role="button"
                tabIndex={0}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => handleOpenPatient(patient)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleOpenPatient(patient)
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.mrn} | DOB: {patient.dob} | Age: {patient.age}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{patient.status}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
