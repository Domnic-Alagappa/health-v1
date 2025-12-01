/**
 * Protected Button Component
 * Wraps buttons to check permission before rendering or enabling
 */

import { useCanAccess } from "./context";
import { Button, type ButtonProps } from "@health-v1/ui-components";

interface ProtectedButtonProps extends ButtonProps {
  buttonId: string; // e.g., "create-user", "delete-user"
  relation?: string; // Default: "can_click"
  hideIfDenied?: boolean; // If true, hide button instead of disabling (default: false)
  tooltipDenied?: string; // Tooltip text when permission denied
}

/**
 * Protected Button - checks permission before rendering/enabling
 */
export function ProtectedButton({
  buttonId,
  relation = "can_click",
  hideIfDenied = false,
  tooltipDenied = "You don't have permission to perform this action",
  disabled,
  ...buttonProps
}: ProtectedButtonProps) {
  const object = `button:${buttonId}`;
  const canAccess = useCanAccess(relation, object, false);

  if (hideIfDenied && !canAccess) {
    return null;
  }

  return (
    <Button
      {...buttonProps}
      disabled={disabled || !canAccess}
      title={!canAccess ? tooltipDenied : buttonProps.title}
    />
  );
}

