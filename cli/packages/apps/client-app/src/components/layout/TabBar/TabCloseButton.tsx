import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TabCloseButtonProps {
  onClose: () => void;
}

export function TabCloseButton({ onClose }: TabCloseButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 -mr-1"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
    >
      <X className="h-3.5 w-3.5" />
    </Button>
  );
}
