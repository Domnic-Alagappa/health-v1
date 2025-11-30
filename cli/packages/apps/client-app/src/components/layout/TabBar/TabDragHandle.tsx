import { GripVertical } from "lucide-react";

export function TabDragHandle() {
  return (
    <div
      className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted/50 rounded opacity-60 hover:opacity-100 transition-opacity"
      title="Drag to reorder"
    >
      <GripVertical className="h-3 w-3 text-muted-foreground" />
    </div>
  );
}
