/**
 * DEK Management Page
 * View and manage user Data Encryption Keys
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from "@health-v1/ui-components";
import { Search, Key, RotateCw, AlertCircle } from "lucide-react";
import { ProtectedPage, ProtectedButton } from "../../lib/permissions";
import {
  listDekStatuses,
  rotateUserDek,
  type RotateDekRequest,
} from "../../lib/api/encryption";

export function DekManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [rotateReason, setRotateReason] = useState("");
  const queryClient = useQueryClient();

  const { data: deksResponse, isLoading } = useQuery({
    queryKey: ["dekStatuses"],
    queryFn: listDekStatuses,
  });

  const deks = deksResponse?.data?.deks || [];

  const rotateMutation = useMutation({
    mutationFn: (request: RotateDekRequest) => rotateUserDek(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dekStatuses"] });
      setRotateDialogOpen(false);
      setSelectedUserId("");
      setRotateReason("");
    },
  });

  const filteredDeks = deks.filter((dek) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      dek.user_id.toLowerCase().includes(searchLower) ||
      dek.user_email?.toLowerCase().includes(searchLower) ||
      false
    );
  });

  const handleRotateClick = (userId: string) => {
    setSelectedUserId(userId);
    setRotateDialogOpen(true);
  };

  const handleRotate = () => {
    if (!selectedUserId) return;
    rotateMutation.mutate({
      user_id: selectedUserId,
      reason: rotateReason || undefined,
    });
  };

  return (
    <ProtectedPage
      pageName="encryption-deks"
      fallback={<div className="p-6">You don't have access to this page.</div>}
    >
      <div className="p-6">
        <Stack spacing="lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">DEK Management</h1>
              <p className="text-muted-foreground">
                View and manage user Data Encryption Keys
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User DEK Status</CardTitle>
                  <CardDescription>
                    View DEK status for all users and rotate keys when needed
                  </CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    className="pl-8 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Loading DEK statuses...</p>
                </div>
              ) : filteredDeks.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-center">
                  <div className="space-y-2">
                    <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "No users found matching your search" : "No DEKs found"}
                    </p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User ID</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Rotated</TableHead>
                      <TableHead>Rotations</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDeks.map((dek) => (
                      <TableRow key={dek.user_id}>
                        <TableCell className="font-mono text-sm">{dek.user_id}</TableCell>
                        <TableCell>{dek.user_email || "-"}</TableCell>
                        <TableCell>
                          {dek.dek_exists ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="outline">Missing</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {dek.dek_created_at
                            ? new Date(dek.dek_created_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {dek.dek_rotated_at
                            ? new Date(dek.dek_rotated_at).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>{dek.rotation_count || 0}</TableCell>
                        <TableCell className="text-right">
                          <ProtectedButton
                            buttonId={`rotate-dek-${dek.user_id}`}
                            variant="outline"
                            size="sm"
                            onClick={() => handleRotateClick(dek.user_id)}
                            disabled={!dek.dek_exists}
                          >
                            <RotateCw className="h-4 w-4 mr-1" />
                            Rotate
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

        {/* Rotate DEK Dialog */}
        <Dialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rotate User DEK</DialogTitle>
              <DialogDescription>
                Rotating a DEK will decrypt all user data with the old key and re-encrypt it with
                a new key. This process may take some time.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="user-id">User ID</Label>
                <Input id="user-id" value={selectedUserId} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Input
                  id="reason"
                  value={rotateReason}
                  onChange={(e) => setRotateReason(e.target.value)}
                  placeholder="e.g., Password reset, Security event"
                />
              </div>
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Warning: This operation will re-encrypt all user data. Ensure you have backups
                  and that this is necessary.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRotateDialogOpen(false);
                  setRotateReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRotate}
                disabled={rotateMutation.isPending || !selectedUserId}
              >
                {rotateMutation.isPending ? "Rotating..." : "Rotate DEK"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}

