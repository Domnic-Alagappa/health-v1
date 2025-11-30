import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Stack,
} from "@health-v1/ui-components";
import { Building2, Plus, Search } from "lucide-react";

export function OrganizationsPage() {
  return (
    <div className="p-6">
      <Stack spacing="lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Organizations</h1>
            <p className="text-muted-foreground">Manage organizations and their settings</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Organization
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Organizations</CardTitle>
                <CardDescription>View and manage all organizations in the system</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search organizations..." className="pl-8 w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center py-12 text-center">
                <div className="space-y-2">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No organizations found</p>
                  <p className="text-xs text-muted-foreground">
                    Create your first organization to get started
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Stack>
    </div>
  );
}
