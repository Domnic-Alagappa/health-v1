import { createFileRoute } from "@tanstack/react-router"
import { Activity, Plus, Search, Server } from "lucide-react"
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Stack } from "@health-v1/ui-components"

export const Route = createFileRoute("/services")({
  component: ServicesPage,
})

function ServicesPage() {
  return (
    <div className="p-6">
      <Stack spacing="lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Services</h1>
            <p className="text-muted-foreground">Manage services and API endpoints</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Registered services</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Status</CardTitle>
              <Badge variant="outline">Unknown</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">System health</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Services</CardTitle>
                <CardDescription>View and manage all services and their configurations</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center py-12 text-center">
                <div className="space-y-2">
                  <Server className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No services found</p>
                  <p className="text-xs text-muted-foreground">
                    Add your first service to get started
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Stack>
    </div>
  )
}

