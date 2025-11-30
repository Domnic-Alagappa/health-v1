/**
 * MaskedField Component
 * Component that automatically masks sensitive fields with progressive disclosure
 */

import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Flex } from "@/components/ui/flex";
import { useAuditLog } from "@/hooks/security/useAuditLog";
import { useMasking } from "@/hooks/security/useMasking";
import type { MaskingLevel } from "@health-v1/shared/constants/security";
import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

interface MaskedFieldProps {
  value: string;
  field: string;
  level?: MaskingLevel;
  label?: string;
  showRevealButton?: boolean;
  className?: string;
}

export function MaskedField({
  value,
  field,
  level,
  label,
  showRevealButton = true,
  className = "",
}: MaskedFieldProps) {
  const { mask } = useMasking();
  const { logPHI } = useAuditLog();
  const [revealed, setRevealed] = useState(false);

  const maskedValue = mask(value, field, level);
  const displayValue = revealed ? value : maskedValue;

  const handleReveal = () => {
    if (!revealed) {
      // Log PHI access on reveal
      logPHI("field", field, { field, action: "reveal" });
    }
    setRevealed(!revealed);
  };

  return (
    <Flex align="center" gap="sm" className={className}>
      <Box className="flex-1">
        {label && <span className="text-sm text-muted-foreground mr-2">{label}:</span>}
        <span className={revealed ? "" : "font-mono"}>{displayValue}</span>
        {!revealed && <Lock className="inline-block ml-2 h-3 w-3 text-muted-foreground" />}
      </Box>
      {showRevealButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReveal}
          className="h-8 w-8 p-0"
          aria-label={revealed ? "Hide value" : "Reveal value"}
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      )}
    </Flex>
  );
}
