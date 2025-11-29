import { ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarCollapseButtonProps {
  onToggle: () => void
}

export function SidebarCollapseButton({ onToggle }: SidebarCollapseButtonProps) {
  return (
    <div className="p-2 border-t shrink-0">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="w-full"
        title="Expand sidebar"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
