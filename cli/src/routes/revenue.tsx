import { createFileRoute } from "@tanstack/react-router"
import { CreditCard, DollarSign, TrendingUp } from "lucide-react"
import { ProtectedRoute } from "@/components/security/ProtectedRoute"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PERMISSIONS } from "@/lib/constants/permissions"

export const Route = createFileRoute("/revenue")({
  component: RevenueComponent,
})

function RevenueComponent() {
  return (
    <ProtectedRoute requiredPermission={PERMISSIONS.REVENUE.VIEW} resource="revenue">
      <RevenueComponentInner />
    </ProtectedRoute>
  )
}

function RevenueComponentInner() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Revenue Cycle</h1>
        <p className="text-muted-foreground mt-2">Financial management, billing, and claims</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Charges</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$125,430</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">347</div>
            <p className="text-xs text-muted-foreground">Awaiting submission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AR Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Average days outstanding</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
