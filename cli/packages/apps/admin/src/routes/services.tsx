import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Stack,
} from "@health-v1/ui-components";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  Server,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { getServiceStatus } from "../lib/api/services";

function getStatusIcon(status: string) {
  switch (status.toLowerCase()) {
    case "operational":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "degraded":
      return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    case "down":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Server className="h-4 w-4 text-muted-foreground" />;
  }
}

function ServiceRow({
  service,
}: {
  service: {
    name: string;
    enabled: boolean;
    operational: boolean;
    healthEndpoint?: string;
    lastChecked?: string;
    error?: string;
  };
}) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        {service.operational ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <XCircle className="h-5 w-5 text-red-600" />
        )}
        <div>
          <div className="font-medium">{service.name}</div>
          {service.healthEndpoint && (
            <div className="text-xs text-muted-foreground">{service.healthEndpoint}</div>
          )}
          {service.error && <div className="text-xs text-red-600 mt-1">{service.error}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={service.enabled ? "default" : "outline"}>
          {service.enabled ? "Enabled" : "Disabled"}
        </Badge>
        <Badge variant={service.operational ? "default" : "destructive"}>
          {service.operational ? "Operational" : "Down"}
        </Badge>
      </div>
    </div>
  );
}

export function ServicesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    data: serviceStatus,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["serviceStatus"],
    queryFn: getServiceStatus,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const filteredServices =
    serviceStatus?.services.filter((service) =>
      service.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  const enabledServices = serviceStatus?.services.filter((s) => s.enabled) || [];
  const operationalServices = enabledServices.filter((s) => s.operational);

  return (
    <div className="p-6">
      <Stack spacing="lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Services</h1>
            <p className="text-muted-foreground">Manage services and API endpoints</p>
          </div>
          <Button onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{serviceStatus?.services.length || 0}</div>
              <p className="text-xs text-muted-foreground">Registered services</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Services</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{operationalServices.length}</div>
              <p className="text-xs text-muted-foreground">Currently operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Status</CardTitle>
              {serviceStatus && getStatusIcon(serviceStatus.overallStatus)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {serviceStatus?.overallStatus || "Unknown"}
              </div>
              <p className="text-xs text-muted-foreground">
                {serviceStatus?.checkedAt
                  ? `Checked: ${new Date(serviceStatus.checkedAt).toLocaleTimeString()}`
                  : "System health"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Services</CardTitle>
                <CardDescription>
                  View and manage all services and their configurations
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search services..."
                    className="pl-8 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <RefreshCw className="mx-auto h-8 w-8 text-muted-foreground animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading service status...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-12 text-center">
                <div className="space-y-2">
                  <XCircle className="mx-auto h-12 w-12 text-red-600" />
                  <p className="text-sm text-red-600">Failed to load service status</p>
                  <p className="text-xs text-muted-foreground">
                    {error instanceof Error ? error.message : "Unknown error"}
                  </p>
                  <Button onClick={() => refetch()} variant="outline" size="sm">
                    Retry
                  </Button>
                </div>
              </div>
            ) : filteredServices.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-center">
                <div className="space-y-2">
                  <Server className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No services found</p>
                  {searchQuery && (
                    <p className="text-xs text-muted-foreground">
                      No services match "{searchQuery}"
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredServices.map((service) => (
                  <ServiceRow key={service.name} service={service} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </Stack>
    </div>
  );
}
