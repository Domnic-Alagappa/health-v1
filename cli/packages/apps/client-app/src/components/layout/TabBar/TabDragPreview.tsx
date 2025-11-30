import { Box } from "@/components/ui/box";
import { Flex } from "@/components/ui/flex";
import { cn } from "@/lib/utils";

interface TabDragPreviewProps {
  draggedTab: { id: string; label: string; icon?: React.ReactNode };
  dragPosition: { x: number; y: number };
  dragOffset: { x: number; y: number };
  isDraggingOutside: boolean;
}

export function TabDragPreview({
  draggedTab,
  dragPosition,
  dragOffset,
  isDraggingOutside,
}: TabDragPreviewProps) {
  return (
    <Box
      className="fixed pointer-events-none z-[9999] transition-none"
      style={{
        left: `${dragPosition.x - dragOffset.x}px`,
        top: `${dragPosition.y - dragOffset.y}px`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <Flex
        className={cn(
          "items-center gap-2 px-4 py-2.5 rounded-lg border-2 shadow-lg",
          "bg-white",
          "min-w-[140px] max-w-[220px]",
          isDraggingOutside ? "border-accent" : "border-primary"
        )}
      >
        {draggedTab.icon && (
          <span
            className={cn(
              "h-[18px] w-[18px] shrink-0",
              isDraggingOutside ? "text-accent" : "text-primary"
            )}
          >
            {draggedTab.icon}
          </span>
        )}
        <span className="text-[14px] font-medium tracking-[0.25px] text-foreground truncate">
          {draggedTab.label}
        </span>
        {isDraggingOutside && (
          <span className="text-xs text-green-500 font-medium">(New Window)</span>
        )}
        <Box
          className={cn(
            "absolute -inset-1 rounded-lg blur-sm -z-10 animate-pulse",
            isDraggingOutside ? "bg-green-500/20" : "bg-primary/20"
          )}
        />
      </Flex>
    </Box>
  );
}
