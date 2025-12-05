/**
 * Register Page Form Component
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label, Stack } from "@health-v1/ui-components";
import { registerPage, type RegisterPageRequest } from "../../lib/api/ui-entities";

interface RegisterPageFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RegisterPageForm({ onSuccess, onCancel }: RegisterPageFormProps) {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: RegisterPageRequest) => registerPage(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uiPages"] });
      setName("");
      setPath("");
      setDescription("");
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      name,
      path,
      description: description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing="md">
        <div className="grid gap-2">
          <Label htmlFor="page-name">Page Name</Label>
          <Input
            id="page-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="users, organizations, etc."
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="page-path">Page Path</Label>
          <Input
            id="page-path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/users, /organizations, etc."
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="page-description">Description (Optional)</Label>
          <Input
            id="page-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the page"
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Registering..." : "Register Page"}
          </Button>
        </div>
      </Stack>
    </form>
  );
}

