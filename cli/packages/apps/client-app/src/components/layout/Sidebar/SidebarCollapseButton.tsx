import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

interface SidebarCollapseButtonProps {
  onToggle: () => void;
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
  );
}
