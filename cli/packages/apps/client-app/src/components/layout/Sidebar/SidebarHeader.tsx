import { Button } from "@/components/ui/button";
import { Flex } from "@/components/ui/flex";
import { ChevronLeft, Stethoscope } from "lucide-react";

interface SidebarHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function SidebarHeader({ isCollapsed, onToggle }: SidebarHeaderProps) {
  return (
    <Flex className="items-center justify-between p-4 border-b shrink-0">
      {isCollapsed ? (
        <Flex className="items-center justify-center w-full">
          <Stethoscope className="h-6 w-6 text-primary shrink-0" />
        </Flex>
      ) : (
        <>
          <Flex className="items-center gap-2 min-w-0">
            <Stethoscope className="h-6 w-6 text-primary shrink-0" />
            <h2 className="text-lg font-semibold truncate">Salk Commons Health</h2>
          </Flex>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="shrink-0"
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </>
      )}
    </Flex>
  );
}
