import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import type { FormField } from "@/components/ui/form-builder"
import { cn } from "@/lib/utils"

interface FormFieldSectionProps {
  field: FormField
  className?: string
}

export function FormFieldSection({ field, className }: FormFieldSectionProps) {
  if (field.type !== "separator" && field.type !== "display-text") return null

  if (field.type === "separator") {
    return (
      <Box className={cn("col-span-12 my-4", className)}>
        <Box className="relative">
          <Box className="absolute inset-0 flex items-center">
            <Box className="w-full border-t border-[#E1E4E8]"></Box>
          </Box>
          {field.label && (
            <Flex className="relative justify-center text-sm">
              <span className="bg-background px-4 text-muted-foreground">{field.label}</span>
            </Flex>
          )}
        </Box>
      </Box>
    )
  }

  return (
    <Box className={cn("col-span-12", className)}>
      {field.label && <h3 className="text-base font-semibold">{field.label}</h3>}
      {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
    </Box>
  )
}
