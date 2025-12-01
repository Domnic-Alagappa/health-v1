/**
 * Enhanced Permissions Page
 * Full permission management with Zanzibar relationships
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
  Badge,
} from "@health-v1/ui-components";
import { Plus, Search, Shield, Trash2, Calendar, User } from "lucide-react";
import { ProtectedPage, ProtectedButton } from "../lib/permissions";
import { getUserPermissions, revokePermission, type PermissionInfo } from "../lib/api/permissions";
import { AssignPermissionDialog } from "../components/permissions/AssignPermissionDialog";

interface PermissionRow {
  id: string;
  subject: string;
  relation: string;
  object: string;
  expires_at?: string;
  valid_from?: string;
}

export function PermissionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // For now, we'll need to get permissions from a user
  // In a real implementation, we'd have an endpoint to list all relationships
  const { data: permissionsResponse, isLoading } = useQuery({
    queryKey: ["userPermissions", selectedUserId],
    queryFn: () => getUserPermissions(selectedUserId),
    enabled: !!selectedUserId,
  });

  const permissions = permissionsResponse?.permissions || [];

  const revokeMutation = useMutation({
    mutationFn: (request: { subject: string; relation: string; object: string }) =>
      revokePermission(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPermissions", selectedUserId] });
    },
  });

  const filteredPermissions = permissions.filter((perm) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      perm.relation.toLowerCase().includes(searchLower) ||
      perm.object.toLowerCase().includes(searchLower)
    );
  });

  return (
    <ProtectedPage pageName="permissions" fallback={<div className="p-6">You don't have access to this page.</div>}>
      <div className="p-6">
        <Stack spacing="lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Permissions</h1>
              <p className="text-muted-foreground">Manage permissions and Zanzibar relationships</p>
            </div>
            <ProtectedButton
              buttonId="create-permission"
              onClick={() => setAssignDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Assign Permission
            </ProtectedButton>
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
                    <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="User ID..."
                      className="pl-8 w-48"
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                    />
                  </div>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search permissions..."
                      className="pl-8 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedUserId ? (
                <div className="flex items-center justify-center py-12 text-center">
                  <div className="space-y-2">
                    <User className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Enter a user ID to view their permissions
                    </p>
                  </div>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading permissions...</p>
                </div>
              ) : filteredPermissions.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-center">
                  <div className="space-y-2">
                    <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery
                        ? "No permissions found matching your search"
                        : "No permissions found for this user"}
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Relation</TableHead>
                      <TableHead>Object</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPermissions.map((perm, index) => (
                      <TableRow key={`${perm.relation}-${perm.object}-${index}`}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{perm.relation}</Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">{perm.object}</TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <ProtectedButton
                            buttonId={`revoke-permission-${index}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (
                                confirm(
                                  `Are you sure you want to revoke permission "${perm.relation}" on "${perm.object}"?`
                                )
                              ) {
                                revokeMutation.mutate({
                                  subject: `user:${selectedUserId}`,
                                  relation: perm.relation,
                                  object: perm.object,
                                });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </ProtectedButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </Stack>

        <AssignPermissionDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          defaultSubject={selectedUserId}
        />
      </div>
    </ProtectedPage>
  );
}
