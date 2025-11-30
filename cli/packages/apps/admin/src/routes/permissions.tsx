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
import { Plus, Search, Shield } from "lucide-react";

export function PermissionsPage() {
  return (
    <div className="p-6">
      <Stack spacing="lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
            <p className="text-muted-foreground">Manage permissions and access control</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Permission
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Permissions</CardTitle>
                <CardDescription>
                  View and manage permissions and Zanzibar relationships
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search permissions..." className="pl-8 w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center py-12 text-center">
                <div className="space-y-2">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No permissions found</p>
                  <p className="text-xs text-muted-foreground">
                    Create your first permission to get started
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
