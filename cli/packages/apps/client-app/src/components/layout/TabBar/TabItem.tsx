import { memo, useRef } from "react"
import { Box } from "@/components/ui/box"
import { Flex } from "@/components/ui/flex"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useTabDrag } from "@/hooks/ui/useTabDrag"
import { cn } from "@/lib/utils"
import { TabCloseButton } from "./TabCloseButton"
import { TabDragHandle } from "./TabDragHandle"
import { getModuleColor } from "./useTabColors"

export interface TabItemProps {
  tab: {
    id: string
    label: string
    path: string
    icon?: React.ReactNode
    closable?: boolean
    alert?: boolean
    success?: boolean
    disabled?: boolean
  }
  isActive: boolean
  isDragging?: boolean
  isDragOver?: boolean
  onSelect: () => void
  onClose: () => void
  onDragStart: (e: React.MouseEvent) => void
}

const DASHBOARD_ID = "dashboard"

export const TabItem = memo(function TabItem({
  tab,
  isActive,
  isDragging,
  isDragOver,
  onSelect,
  onClose,
  onDragStart,
}: TabItemProps) {
  const isDraggable = tab.closable && tab.id !== DASHBOARD_ID && tab.path !== "/"
  const tabRef = useRef<HTMLDivElement>(null)
  const { handleMouseDown } = useTabDrag({ isDraggable, onDragStart, onSelect })

  return (
    <Box
      ref={tabRef}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${tab.id}`}
      aria-label={tab.label}
      tabIndex={isActive ? 0 : -1}
      className={cn(
        "flex items-center gap-1 shrink-0 relative transition-all duration-200",
        isDragging && "opacity-30 scale-95 transform-gpu",
        isDragOver && "border-l-2 border-primary animate-pulse"
      )}
      data-tab-id={tab.id}
      style={isDragging ? { cursor: "grabbing", zIndex: 1000 } : undefined}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          if (!isDraggable) {
            onSelect()
          }
        }
        // Arrow key navigation for tabs
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault()
          const tabs = Array.from(document.querySelectorAll<HTMLElement>('[role="tab"]'))
          const currentIndex = tabs.findIndex((t) => t === e.currentTarget)
          const direction = e.key === "ArrowLeft" ? -1 : 1
          const nextIndex = (currentIndex + direction + tabs.length) % tabs.length
          tabs[nextIndex]?.focus()
        }
      }}
    >
      {isDraggable && <TabDragHandle />}
      <Tooltip>
        <TooltipTrigger asChild>
          <Box
            role="tab"
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            aria-label={`${tab.label}${tab.closable ? ". Press Delete to close" : ""}`}
            tabIndex={isActive ? 0 : -1}
            className={cn(
              // Base styles - Microsoft Fluent UI tab design
              "group flex items-center gap-1.5 h-[42px] px-4 py-2 border-b-4 transition-fluent w-[180px] shrink-0",
              "text-[14px] font-medium tracking-[0.25px]",
              "rounded-t-sm", // 4px top corners only (Fluent UI)
              isDraggable && !isDragging && "cursor-grab active:cursor-grabbing",
              !isDraggable && !tab.disabled && "cursor-pointer",
              tab.disabled && "cursor-not-allowed opacity-60",

              // Default (Inactive) State - Fluent UI styling
              !isActive &&
                !tab.disabled &&
                !tab.alert &&
                !tab.success && [
                  "bg-[#F4F6F8] border-[#E1E4E8] text-[#4A4A4E]",
                  "hover:bg-[#E9EEF3] hover:border-[#D0D6DB] hover:text-[#1C1C1E]",
                ],

              // Active State - Microsoft Fluent style with 4px bottom border
              isActive &&
                !tab.alert &&
                !tab.success && [
                  "bg-white border-primary text-primary shadow-fluent-1",
                ],

              // Alert State
              tab.alert && [
                isActive
                  ? "bg-[#FFF5F2] border-warning text-warning shadow-fluent-1"
                  : "bg-[#F4F6F8] border-transparent text-warning hover:bg-[#FFF5F2] hover:border-warning",
              ],

              // Success State
              tab.success && [
                isActive
                  ? "bg-[#F0FAF4] border-accent text-accent shadow-fluent-1"
                  : "bg-[#F4F6F8] border-transparent text-accent hover:bg-[#F0FAF4] hover:border-accent",
              ],

              // Disabled State
              tab.disabled && [
                "bg-[#F4F6F8] border-transparent text-[#A5A5A5]",
              ]
            )}
            style={
              isActive && !tab.alert && !tab.success
                ? {
                    borderBottomColor: getModuleColor(tab.path).color,
                  }
                : undefined
            }
            onMouseDown={isDraggable ? handleMouseDown : undefined}
            onClick={!isDraggable && !tab.disabled ? onSelect : undefined}
            onKeyDown={(e) => {
              if (!isDraggable && !tab.disabled && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault()
                onSelect()
              }
            }}
          >
            {tab.icon && (
              <span
                className={cn(
                  "shrink-0 transition-colors",
                  !isActive && !tab.alert && !tab.success && "text-[#4A4A4E]",
                  tab.alert && "text-warning",
                  tab.success && "text-accent",
                  tab.disabled && "text-[#A5A5A5]"
                )}
                style={{
                  width: "18px",
                  height: "18px",
                  ...(isActive && !tab.alert && !tab.success
                    ? {
                        color: getModuleColor(tab.path).color,
                      }
                    : {}),
                }}
              >
                {tab.icon}
              </span>
            )}
            <span
              className={cn(
                "truncate flex-1 capitalize",
                !isActive && !tab.alert && !tab.success && "text-[#4A4A4E]",
                tab.alert && "text-warning",
                tab.success && "text-accent",
                tab.disabled && "text-[#A5A5A5]"
              )}
              style={
                isActive && !tab.alert && !tab.success
                  ? {
                      color: getModuleColor(tab.path).color,
                    }
                  : undefined
              }
            >
              {tab.label}
            </span>
            {tab.closable && !tab.disabled && <TabCloseButton onClose={onClose} />}
          </Box>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tab.label}</p>
        </TooltipContent>
      </Tooltip>
    </Box>
  )
})
