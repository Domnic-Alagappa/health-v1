/**
 * Roles Management Page
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@health-v1/ui-components";
import { Plus, Search, Shield, Edit, Trash2 } from "lucide-react";
import { ProtectedPage, ProtectedButton } from "../lib/permissions";
import { listRoles, createRole, deleteRole, type Role } from "../lib/api/roles";
import { useState } from "react";

export function RolesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: rolesResponse, isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: listRoles,
  });

  // Handle both { roles: [] } and [] response formats
  const roles = Array.isArray(rolesResponse?.data) 
    ? rolesResponse.data 
    : rolesResponse?.data?.roles || [];

  const createMutation = useMutation({
    mutationFn: createRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    },
  });

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedPage pageName="roles" fallback={<div className="p-6">You don't have access to this page.</div>}>
      <div className="p-6">
        <Stack spacing="lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Roles</h1>
              <p className="text-muted-foreground">Manage roles and their permissions</p>
            </div>
            <ProtectedButton buttonId="create-role">
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </ProtectedButton>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Roles</CardTitle>
                  <CardDescription>View and manage all roles in the system</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search roles..."
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
                  <p className="text-muted-foreground">Loading roles...</p>
                </div>
              ) : filteredRoles.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-center">
                  <div className="space-y-2">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No roles found matching your search" : "No roles found"}
                    </p>
                    {!searchQuery && (
                      <p className="text-xs text-muted-foreground">
                        Create your first role to get started
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRoles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description || "-"}</TableCell>
                        <TableCell>
                          {role.permissions?.length || 0} permission(s)
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ProtectedButton
                              buttonId={`edit-role-${role.id}`}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit className="h-4 w-4" />
                            </ProtectedButton>
                            <ProtectedButton
                              buttonId={`delete-role-${role.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
                                  deleteMutation.mutate(role.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </ProtectedButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Stack>
      </div>
    </ProtectedPage>
  );
}

