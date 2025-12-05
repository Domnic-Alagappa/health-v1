/**
 * Permission Assignment Dialog
 * Dialog for assigning permissions to users, roles, or groups
 */

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectItem,
  SelectValue,
} from "@health-v1/ui-components";
import { assignPermission, type AssignPermissionRequest } from "../../lib/api/permissions";

interface AssignPermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultSubject?: string;
  defaultRelation?: string;
  defaultObject?: string;
}

export function AssignPermissionDialog({
  open,
  onOpenChange,
  defaultSubject,
  defaultRelation,
  defaultObject,
}: AssignPermissionDialogProps) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState(defaultSubject || "");
  const [subjectType, setSubjectType] = useState<"user" | "role" | "group">("user");
  const [relation, setRelation] = useState(defaultRelation || "can_view");
  const [object, setObject] = useState(defaultObject || "");
  const [expiresAt, setExpiresAt] = useState("");
  const [validFrom, setValidFrom] = useState("");

  const mutation = useMutation({
    mutationFn: (request: AssignPermissionRequest) => assignPermission(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      queryClient.invalidateQueries({ queryKey: ["userPermissions"] });
      onOpenChange(false);
    },
  });

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSubject(defaultSubject || "");
      setSubjectType("user");
      setRelation(defaultRelation || "can_view");
      setObject(defaultObject || "");
      setExpiresAt("");
      setValidFrom("");
    }
  }, [open, defaultSubject, defaultRelation, defaultObject]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const subjectStr = subjectType === "user" 
      ? `user:${subject}`
      : subjectType === "role"
      ? `role:${subject}`
      : `group:${subject}`;

    mutation.mutate({
      subject: subjectStr,
      relation,
      object,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      valid_from: validFrom ? new Date(validFrom).toISOString() : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Permission</DialogTitle>
            <DialogDescription>
              Assign a permission to a user, role, or group using Zanzibar relationships
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject-type">Subject Type</Label>
              <Select
                id="subject-type"
                value={subjectType}
                onChange={(e) => setSubjectType(e.target.value as "user" | "role" | "group")}
              >
                <SelectValue placeholder="Select type" />
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="subject">
                {subjectType === "user" ? "User ID" : subjectType === "role" ? "Role Name" : "Group ID"}
              </Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={subjectType === "user" ? "user-id" : subjectType === "role" ? "admin" : "group-id"}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="relation">Relation</Label>
              <Select
                id="relation"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
              >
                <SelectValue placeholder="Select relation" />
                <SelectItem value="can_view">Can View</SelectItem>
                <SelectItem value="can_edit">Can Edit</SelectItem>
                <SelectItem value="can_click">Can Click</SelectItem>
                <SelectItem value="can_call">Can Call</SelectItem>
                <SelectItem value="can_create">Can Create</SelectItem>
                <SelectItem value="can_delete">Can Delete</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="has_role">Has Role</SelectItem>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="object">Object (Resource)</Label>
              <Input
                id="object"
                value={object}
                onChange={(e) => setObject(e.target.value)}
                placeholder="page:users, button:create-user, field:user-email, etc."
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="valid-from">Valid From (Optional)</Label>
              <Input
                id="valid-from"
                type="datetime-local"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="expires-at">Expires At (Optional)</Label>
              <Input
                id="expires-at"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Assigning..." : "Assign Permission"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

