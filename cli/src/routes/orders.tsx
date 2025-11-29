import { createFileRoute } from "@tanstack/react-router"
import { Plus } from "lucide-react"
import { ProtectedRoute } from "@/components/security/ProtectedRoute"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PERMISSIONS } from "@/lib/constants/permissions"

export const Route = createFileRoute("/orders")({
  component: OrdersComponent,
})

function OrdersComponent() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.ORDERS.VIEW} resource="orders">
      <OrdersComponentInner />
    </ProtectedRoute>
  )
}

function OrdersComponentInner() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground mt-2">Create and manage clinical orders</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Laboratory</CardTitle>
            <CardDescription>Lab orders and panels</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Radiology</CardTitle>
            <CardDescription>Imaging studies</CardDescription>
          </CardHeader>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle>Medications</CardTitle>
            <CardDescription>Prescription orders</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
