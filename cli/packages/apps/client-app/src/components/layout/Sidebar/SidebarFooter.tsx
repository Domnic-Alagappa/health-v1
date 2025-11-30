import { Box } from "@/components/ui/box";

interface SidebarFooterProps {
  isCollapsed: boolean;
}

export function SidebarFooter({ isCollapsed }: SidebarFooterProps) {
  if (isCollapsed) return null;

  return (
    <Box className="p-4 border-t shrink-0">
      <Box className="text-xs text-muted-foreground text-center">HIPAA Compliant</Box>
    </Box>
  );
}
