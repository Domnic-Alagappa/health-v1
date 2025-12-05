/**
 * Register Field Form Component
 */

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Label, Select, SelectItem, SelectValue, Stack } from "@health-v1/ui-components";
import { registerField, type RegisterFieldRequest, listPages } from "../../lib/api/ui-entities";
import { useQuery } from "@tanstack/react-query";

interface RegisterFieldFormProps {
  defaultPageId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RegisterFieldForm({
  defaultPageId,
  onSuccess,
  onCancel,
}: RegisterFieldFormProps) {
  const [pageId, setPageId] = useState(defaultPageId || "");
  const [fieldId, setFieldId] = useState("");
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const queryClient = useQueryClient();

  const { data: pagesResponse } = useQuery({
    queryKey: ["uiPages"],
    queryFn: listPages,
  });

  const pages = pagesResponse?.data?.pages || [];

  const mutation = useMutation({
    mutationFn: (request: RegisterFieldRequest) => registerField(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["uiFields"] });
      setFieldId("");
      setLabel("");
      setFieldType("text");
      onSuccess?.();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      page_id: pageId,
      field_id: fieldId,
      label,
      field_type: fieldType,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing="md">
        <div className="grid gap-2">
          <Label htmlFor="field-page">Page</Label>
          <Select
            id="field-page"
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
          <Label htmlFor="field-id">Field ID</Label>
          <Input
            id="field-id"
            value={fieldId}
            onChange={(e) => setFieldId(e.target.value)}
            placeholder="user-email, user-password, etc."
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="field-label">Label</Label>
          <Input
            id="field-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Email Address"
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="field-type">Field Type</Label>
          <Select
            id="field-type"
            value={fieldType}
            onChange={(e) => setFieldType(e.target.value)}
            required
          >
            <SelectValue placeholder="Select field type" />
            <SelectItem value="text">Text</SelectItem>
            <SelectItem value="password">Password</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="number">Number</SelectItem>
            <SelectItem value="select">Select</SelectItem>
            <SelectItem value="checkbox">Checkbox</SelectItem>
            <SelectItem value="textarea">Textarea</SelectItem>
            <SelectItem value="date">Date</SelectItem>
          </Select>
        </div>

        <div className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={mutation.isPending || !pageId}>
            {mutation.isPending ? "Registering..." : "Register Field"}
          </Button>
        </div>
      </Stack>
    </form>
  );
}

