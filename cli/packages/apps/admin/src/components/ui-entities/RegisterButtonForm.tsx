/**
 * Register Button Form Component
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label, Select, SelectItem, SelectValue, Stack } from "@health-v1/ui-components";
import { registerButton, type RegisterButtonRequest } from "../../lib/api/ui-entities";
import { useQuery } from "@tanstack/react-query";
import { listPages } from "../../lib/api/ui-entities";

interface RegisterButtonFormProps {
  defaultPageId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RegisterButtonForm({
  defaultPageId,
  onSuccess,
  onCancel,
}: RegisterButtonFormProps) {
  const [pageId, setPageId] = useState(defaultPageId || "");
  const [buttonId, setButtonId] = useState("");
  const [label, setLabel] = useState("");
  const [action, setAction] = useState("");
  const queryClient = useQueryClient();

  const { data: pagesResponse } = useQuery({
    queryKey: ["uiPages"],
    queryFn: listPages,
  });

  const pages = pagesResponse?.data?.pages || [];

  const mutation = useMutation({
    mutationFn: (request: RegisterButtonRequest) => registerButton(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uiButtons"] });
      setButtonId("");
      setLabel("");
      setAction("");
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      page_id: pageId,
      button_id: buttonId,
      label,
      action: action || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing="md">
        <div className="grid gap-2">
          <Label htmlFor="button-page">Page</Label>
          <Select
            id="button-page"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            required
          >
            <SelectValue placeholder="Select a page" />
            {pages.map((page) => (
              <SelectItem key={page.id} value={page.id}>
                {page.name} ({page.path})
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="button-id">Button ID</Label>
          <Input
            id="button-id"
            value={buttonId}
            onChange={(e) => setButtonId(e.target.value)}
            placeholder="create-user, delete-user, etc."
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="button-label">Label</Label>
          <Input
            id="button-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Create User"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="button-action">Action (Optional)</Label>
          <Input
            id="button-action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="create, delete, edit, etc."
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={mutation.isPending || !pageId}>
            {mutation.isPending ? "Registering..." : "Register Button"}
          </Button>
        </div>
      </Stack>
    </form>
  );
}

