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
import { Plus, Search, Users } from "lucide-react";
import { ProtectedPage, ProtectedButton } from "../lib/permissions";

export function UsersPage() {
  return (
    <ProtectedPage pageName="users" fallback={<div className="p-6">You don't have access to this page.</div>}>
      <div className="p-6">
        <Stack spacing="lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Users</h1>
              <p className="text-muted-foreground">Manage users and their permissions</p>
            </div>
            <ProtectedButton buttonId="create-user">
              <Plus className="mr-2 h-4 w-4" />
              Create User
            </ProtectedButton>
          </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Users</CardTitle>
                <CardDescription>View and manage all users in the system</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-8 w-64" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center py-12 text-center">
                <div className="space-y-2">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No users found</p>
                  <p className="text-xs text-muted-foreground">
                    Create your first user to get started
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Stack>
    </div>
    </ProtectedPage>
  );
}
