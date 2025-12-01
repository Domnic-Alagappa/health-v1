/**
 * Groups Management Page
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
import { Plus, Search, Users, Edit, Trash2 } from "lucide-react";
import { ProtectedPage, ProtectedButton } from "../lib/permissions";
import { listGroups, createGroup, deleteGroup, type Group } from "../lib/api/groups";
import { useState } from "react";

export function GroupsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: groupsResponse, isLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: listGroups,
  });

  const groups = groupsResponse?.data?.groups || groupsResponse?.data || [];

  const createMutation = useMutation({
    mutationFn: createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ProtectedPage pageName="groups" fallback={<div className="p-6">You don't have access to this page.</div>}>
      <div className="p-6">
        <Stack spacing="lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Groups</h1>
              <p className="text-muted-foreground">Manage user groups and their permissions</p>
            </div>
            <ProtectedButton buttonId="create-group">
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </ProtectedButton>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>All Groups</CardTitle>
                  <CardDescription>View and manage all groups in the system</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search groups..."
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
                  <p className="text-muted-foreground">Loading groups...</p>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-center">
                  <div className="space-y-2">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No groups found matching your search" : "No groups found"}
                    </p>
                    {!searchQuery && (
                      <p className="text-xs text-muted-foreground">
                        Create your first group to get started
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
                      <TableHead>Organization</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">{group.name}</TableCell>
                        <TableCell>{group.description || "-"}</TableCell>
                        <TableCell>{group.organization_id || "Global"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ProtectedButton
                              buttonId={`edit-group-${group.id}`}
                              variant="ghost"
                              size="sm"
                            >
                              <Edit className="h-4 w-4" />
                            </ProtectedButton>
                            <ProtectedButton
                              buttonId={`delete-group-${group.id}`}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete group "${group.name}"?`)) {
                                  deleteMutation.mutate(group.id);
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

