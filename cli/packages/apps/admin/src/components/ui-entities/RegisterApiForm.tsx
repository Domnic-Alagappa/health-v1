/**
 * Register API Form Component
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label, Select, SelectItem, SelectValue, Stack } from "@health-v1/ui-components";
import { registerApi, type RegisterApiRequest } from "../../lib/api/ui-entities";

interface RegisterApiFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RegisterApiForm({ onSuccess, onCancel }: RegisterApiFormProps) {
  const [endpoint, setEndpoint] = useState("");
  const [method, setMethod] = useState("GET");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: RegisterApiRequest) => registerApi(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uiApis"] });
      setEndpoint("");
      setMethod("GET");
      setDescription("");
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      endpoint,
      method,
      description: description || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing="md">
        <div className="grid gap-2">
          <Label htmlFor="api-endpoint">Endpoint</Label>
          <Input
            id="api-endpoint"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            placeholder="/api/admin/users, /api/admin/users/:id, etc."
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="api-method">HTTP Method</Label>
          <Select
            id="api-method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            required
          >
            <SelectValue placeholder="Select method" />
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="HEAD">HEAD</SelectItem>
            <SelectItem value="OPTIONS">OPTIONS</SelectItem>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="api-description">Description (Optional)</Label>
          <Input
            id="api-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the API endpoint"
          />
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Registering..." : "Register API"}
          </Button>
        </div>
      </Stack>
    </form>
  );
}

