/**
 * ImmutableField Component
 * Component that prevents editing of immutable fields
 */

import { Lock } from "lucide-react"
import { Flex } from "@/components/ui/flex"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Stack } from "@/components/ui/stack"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ImmutableFieldProps {
  label: string
  value: string | number | Date
  immutable?: boolean
  tooltip?: string
  className?: string
}

export function ImmutableField({
  label,
  value,
  immutable = true,
  tooltip = "This field cannot be modified",
  className = "",
}: ImmutableFieldProps) {
  const displayValue = value instanceof Date ? value.toLocaleDateString() : String(value)

  return (
    <Stack spacing="sm" className={className}>
      <Flex align="center" gap="sm">
        <Label htmlFor={label} className="text-sm font-medium">
          {label}
        </Label>
        {immutable && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Lock className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </Flex>
      <Input
        id={label}
        value={displayValue}
        disabled={immutable}
        readOnly={immutable}
        className={immutable ? "bg-muted cursor-not-allowed" : ""}
        onCopy={(e) => {
          if (immutable) {
            e.preventDefault()
          }
        }}
        onPaste={(e) => {
          if (immutable) {
            e.preventDefault()
          }
        }}
      />
    </Stack>
  )
}
