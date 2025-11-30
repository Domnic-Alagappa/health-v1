import { Activity, Building2, Shield, Users, CheckCircle2, AlertCircle, XCircle, Server } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@health-v1/ui-components"
import { Flex } from "@health-v1/ui-components"
import { Stack } from "@health-v1/ui-components"
import { Badge } from "@health-v1/ui-components"
import { useQuery } from "@tanstack/react-query"
import { getServiceStatus } from "../lib/api/services"
import { getSetupStatus } from "../lib/api/setup"

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "operational":
      return "text-green-600"
    case "degraded":
      return "text-yellow-600"
    case "down":
      return "text-red-600"
    default:
      return "text-muted-foreground"
  }
}

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "operational":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case "degraded":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />
    case "down":
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />
  }
}

export function DashboardPage() {
  const { data: serviceStatus, isLoading: isLoadingServices } = useQuery({
    queryKey: ["serviceStatus"],
    queryFn: getServiceStatus,
    refetchInterval: 30000,
  })

  const { data: setupStatus, isLoading: isLoadingSetup } = useQuery({
    queryKey: ["setupStatus"],
    queryFn: getSetupStatus,
  })

  const enabledServices = serviceStatus?.services.filter(s => s.enabled) || []
  const operationalServices = enabledServices.filter(s => s.operational)
  const overallStatus = serviceStatus?.overallStatus || "unknown"

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
              {serviceStatus && getStatusIcon(overallStatus)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold capitalize ${getStatusColor(overallStatus)}`}>
                {overallStatus === "unknown" ? "-" : overallStatus}
              </div>
              <p className="text-xs text-muted-foreground">
                {operationalServices.length} of {enabledServices.length} services operational
              </p>
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

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Service Status</CardTitle>
              <CardDescription>Current status of infrastructure services</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingServices ? (
                <p className="text-sm text-muted-foreground">Loading service status...</p>
              ) : serviceStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Status</span>
                    <Badge variant={overallStatus === "operational" ? "default" : overallStatus === "degraded" ? "secondary" : "destructive"}>
                      {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {serviceStatus.services.map((service) => (
                      <div key={service.name} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{service.name}</span>
                        {service.enabled ? (
                          <Badge variant={service.operational ? "default" : "destructive"}>
                            {service.operational ? "Operational" : "Down"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Disabled</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  {serviceStatus.checkedAt && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Last checked: {new Date(serviceStatus.checkedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load service status</p>
              )}
            </CardContent>
          </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Status</CardTitle>
            <CardDescription>Initial setup completion status</CardDescription>
          </CardHeader>
          <CardContent>
              {isLoadingSetup ? (
            <p className="text-sm text-muted-foreground">Checking setup status...</p>
              ) : setupStatus ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Setup Status</span>
                    <Badge variant={setupStatus.setup_completed ? "default" : "secondary"}>
                      {setupStatus.setup_completed ? "Completed" : "Not Completed"}
                    </Badge>
                  </div>
                  {setupStatus.setup_completed_at && (
                    <p className="text-xs text-muted-foreground">
                      Completed at: {new Date(setupStatus.setup_completed_at).toLocaleString()}
                    </p>
                  )}
                  {setupStatus.setup_completed_by && (
                    <p className="text-xs text-muted-foreground">
                      Completed by: {setupStatus.setup_completed_by}
                    </p>
                  )}
                  {!setupStatus.setup_completed && (
                    <p className="text-sm text-muted-foreground">
                      Please complete the initial setup to begin using the system.
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unable to load setup status</p>
              )}
          </CardContent>
        </Card>
        </div>
      </Stack>
    </div>
  )
}
