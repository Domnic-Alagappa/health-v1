/**
 * Master Key Management Page
 * View and manage the master encryption key
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Stack,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@health-v1/ui-components";
import { Key, RotateCw, AlertTriangle, Shield, Calendar } from "lucide-react";
import { ProtectedPage, ProtectedButton } from "../../lib/permissions";
import {
  getMasterKeyStatus,
  rotateMasterKey,
} from "../../lib/api/encryption";
import { useState } from "react";

export function MasterKeyManagementPage() {
  const [rotateDialogOpen, setRotateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ["masterKeyStatus"],
    queryFn: getMasterKeyStatus,
  });

  const rotateMutation = useMutation({
    mutationFn: rotateMasterKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masterKeyStatus"] });
      setRotateDialogOpen(false);
    },
  });

  const handleRotate = () => {
    rotateMutation.mutate();
  };

  return (
    <ProtectedPage
      pageName="encryption-master-key"
      fallback={<div className="p-6">You don't have access to this page.</div>}
    >
      <div className="p-6">
        <Stack spacing="lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Master Key Management</h1>
              <p className="text-muted-foreground">
                View and manage the master encryption key used to encrypt DEKs
              </p>
            </div>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <p className="text-muted-foreground">Loading master key status...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Master Key Status</CardTitle>
                  <CardDescription>Current status of the master encryption key</CardDescription>
                </CardHeader>
                <CardContent>
                  <Stack spacing="md">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Key Status</p>
                          <p className="text-sm text-muted-foreground">
                            {status?.exists ? "Master key exists" : "Master key not found"}
                          </p>
                        </div>
                      </div>
                      {status?.exists ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Missing</Badge>
                      )}
                    </div>

                    {status?.exists && (
                      <>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Created At</p>
                              <p className="text-sm text-muted-foreground">
                                {status.created_at
                                  ? new Date(status.created_at).toLocaleString()
                                  : "Unknown"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <RotateCw className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Last Rotated</p>
                              <p className="text-sm text-muted-foreground">
                                {status.last_rotated_at
                                  ? new Date(status.last_rotated_at).toLocaleString()
                                  : "Never"}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Key className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">Rotation Count</p>
                              <p className="text-sm text-muted-foreground">
                                {status.rotation_count || 0} time(s)
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Master Key Operations</CardTitle>
                  <CardDescription>
                    Rotate the master key to re-encrypt all DEKs with a new key
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-blue-900 dark:text-blue-100">
                            Master Key Rotation
                          </p>
                          <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                            Rotating the master key will re-encrypt all DEKs stored in the vault.
                            This does NOT re-encrypt user data - only the DEKs themselves. User
                            data remains encrypted with the same DEKs.
                          </p>
                        </div>
                      </div>
                    </div>

                    <ProtectedButton
                      buttonId="rotate-master-key"
                      onClick={() => setRotateDialogOpen(true)}
                      disabled={!status?.exists}
                    >
                      <RotateCw className="mr-2 h-4 w-4" />
                      Rotate Master Key
                    </ProtectedButton>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </Stack>

        {/* Rotate Master Key Dialog */}
        <Dialog open={rotateDialogOpen} onOpenChange={setRotateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rotate Master Key</DialogTitle>
              <DialogDescription>
                This will generate a new master key and re-encrypt all DEKs in the vault. This
                process may take some time depending on the number of users.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                    Important Information
                  </p>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 mt-2 space-y-1 list-disc list-inside">
                    <li>All DEKs will be re-encrypted with the new master key</li>
                    <li>User data is NOT affected by this operation</li>
                    <li>This operation cannot be undone</li>
                    <li>Ensure you have backups before proceeding</li>
                  </ul>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRotateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleRotate}
                disabled={rotateMutation.isPending}
              >
                {rotateMutation.isPending ? "Rotating..." : "Rotate Master Key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedPage>
  );
}

