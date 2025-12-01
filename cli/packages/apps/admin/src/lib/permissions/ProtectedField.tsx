/**
 * Protected Field Component
 * Wraps form fields to check permission for viewing/editing
 */

import { useCanAccess } from "./context";
import { Input, type InputProps } from "@health-v1/ui-components";

interface ProtectedFieldProps extends InputProps {
  fieldId: string; // e.g., "user-email", "user-password"
  relation?: "can_view" | "can_edit"; // Default: "can_edit"
  hideIfDenied?: boolean; // If true, hide field instead of making read-only (default: false)
}

/**
 * Protected Field - checks permission for viewing/editing
 */
export function ProtectedField({
  fieldId,
  relation = "can_edit",
  hideIfDenied = false,
  readOnly,
  ...inputProps
}: ProtectedFieldProps) {
  const object = `field:${fieldId}`;
  const canView = useCanAccess("can_view", object, false);
  const canEdit = useCanAccess("can_edit", object, false);

  // If can't view, hide or show placeholder
  if (!canView) {
    if (hideIfDenied) {
      return null;
    }
    return (
      <Input
        {...inputProps}
        value=""
        placeholder="No access"
        readOnly
        disabled
      />
    );
  }

  // If can view but can't edit, make read-only
  const isReadOnly = readOnly || !canEdit;

  return (
    <Input
      {...inputProps}
      readOnly={isReadOnly}
      disabled={isReadOnly}
    />
  );
}

