import { ProtectedRoute } from "@/components/security/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PERMISSIONS } from "@health-v1/shared/constants/permissions";
import { createFileRoute } from "@tanstack/react-router";
import { Pill } from "lucide-react";

export const Route = createFileRoute("/pharmacy")({
  component: PharmacyComponent,
});

function PharmacyComponent() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.PHARMACY.VIEW} resource="pharmacy">
      <PharmacyComponentInner />
    </ProtectedRoute>
  );
}

function PharmacyComponentInner() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pharmacy</h1>
        <p className="text-muted-foreground mt-2">Medication management and prescription orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Medication Management</CardTitle>
          <CardDescription>Prescriptions and medication orders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Pharmacy module coming soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
