import { ProtectedRoute } from "@/components/security/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@health-v1/shared/constants/permissions";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Users } from "lucide-react";

export const Route = createFileRoute("/analytics")({
  component: AnalyticsComponent,
});

function AnalyticsComponent() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.ANALYTICS.VIEW} resource="analytics">
      <AnalyticsComponentInner />
    </ProtectedRoute>
  );
}

function AnalyticsComponentInner() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics & Reporting</h1>
        <p className="text-muted-foreground mt-2">
          Clinical dashboards, quality metrics, and performance indicators
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient Volume</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-muted-foreground">Active patients</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admission Rate</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8.2%</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
