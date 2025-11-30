import { createFileRoute } from "@tanstack/react-router"
import { Activity, Building2, Shield, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@health-v1/ui-components"
import { Flex } from "@health-v1/ui-components"
import { Stack } from "@health-v1/ui-components"

export const Route = createFileRoute("/dashboard")({
  component: DashboardPage,
})

function DashboardPage() {
  return (
    <div className="p-6">
      <Stack spacing="lg">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of system status and configuration</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Operational</div>
              <p className="text-xs text-muted-foreground">All systems running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Total organizations</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Total users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permissions</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Active permissions</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Setup Status</CardTitle>
            <CardDescription>Initial setup completion status</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Checking setup status...</p>
          </CardContent>
        </Card>
      </Stack>
    </div>
  )
}

