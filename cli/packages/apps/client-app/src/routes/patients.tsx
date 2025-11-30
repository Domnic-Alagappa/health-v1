import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { ArrowRight, Filter, Plus, Search, Users } from "lucide-react"
import { ProtectedRoute } from "@/components/security/ProtectedRoute"
import { Badge } from "@/components/ui/badge"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flex } from "@/components/ui/flex"
import { Input } from "@/components/ui/input"
import { Stack } from "@/components/ui/stack"
import { PERMISSIONS } from "@health-v1/shared/constants/permissions"
import { useOpenTab } from "@/stores/tabStore"

export const Route = createFileRoute("/patients")({
  component: PatientsComponent,
})

function PatientsComponent() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.PATIENTS.VIEW} resource="patients">
      <PatientsComponentInner />
    </ProtectedRoute>
  )
}

function PatientsComponentInner() {
  const navigate = useNavigate()
  const openTab = useOpenTab()

  // Mock patient data - including John Doe for demo
  const patients = [
    {
      id: "john-doe-123",
      name: "John Doe",
      mrn: "MRN-123456",
      dob: "1985-05-15",
      age: 39,
      gender: "Male",
      status: "Active",
      lastVisit: "2024-01-10",
    },
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
    openTab(
      {
        label: `${patient.name} (${patient.mrn})`,
        path: `/patients/${patient.id}`,
        icon: <Users className="h-4 w-4" />,
        closable: true,
        requiredPermission: PERMISSIONS.PATIENTS.VIEW,
      },
      (path) => navigate({ to: path as "/" | (string & {}) })
    )
  }

  return (
    <Stack spacing="lg">
      <Flex className="items-center justify-between">
        <Stack spacing="xs">
          <h1 className="text-3xl font-bold">Patient Management</h1>
          <p className="text-muted-foreground">Search, view, and manage patient records</p>
        </Stack>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Register New Patient
        </Button>
      </Flex>

      <Card>
        <CardHeader>
          <CardTitle>Patient Search</CardTitle>
          <CardDescription>Search by name, MRN, DOB, or SSN</CardDescription>
        </CardHeader>
        <CardContent>
          <Flex className="gap-2">
            <Box className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search patients..." className="pl-10" />
            </Box>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <Button>Search</Button>
          </Flex>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <Stack spacing="xs">
            {patients.map((patient) => (
              <Flex
                key={patient.id}
                role="button"
                tabIndex={0}
                className="items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
                onClick={() => handleOpenPatient(patient)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    handleOpenPatient(patient)
                  }
                }}
              >
                <Flex className="items-center gap-4">
                  <Box className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </Box>
                  <Box>
                    <p className="font-medium">{patient.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {patient.mrn} | DOB: {patient.dob} | Age: {patient.age}
                    </p>
                  </Box>
                </Flex>
                <Flex className="items-center gap-4">
                  <Badge variant="secondary">{patient.status}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Flex>
              </Flex>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
