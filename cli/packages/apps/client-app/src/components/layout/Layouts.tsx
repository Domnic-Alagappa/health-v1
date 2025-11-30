/**
 * Layout Components
 * Different layout configurations for different route types
 */

import { Outlet } from "@tanstack/react-router"
import { ActionRibbon } from "@/components/ActionRibbon"
import { Sidebar } from "@/components/layout/Sidebar"
import type { SidebarItem } from "@/components/layout/Sidebar/SidebarItem"
import { TabBar } from "@/components/layout/TabBar"
import { Box } from "@/components/ui/box"
import { Container } from "@/components/ui/container"
import { Flex } from "@/components/ui/flex"
import { SkipToMainContent } from "@/lib/accessibility"

interface FullLayoutProps {
  sidebarItems: SidebarItem[]
  isSidebarCollapsed: boolean
  onToggleSidebar: () => void
  isMobileSidebarOpen: boolean
  onCloseMobileSidebar: () => void
  onToggleMobileSidebar: () => void
  onTabAction: (actionId: string) => void
}

/**
 * Full Layout - Sidebar + Tab Bar + Action Ribbon
 * Used for main application pages
 */
export function FullLayout({
  sidebarItems,
  isSidebarCollapsed,
  onToggleSidebar,
  isMobileSidebarOpen,
  onCloseMobileSidebar,
  onToggleMobileSidebar,
  onTabAction,
}: FullLayoutProps) {
  return (
    <Flex className="h-screen overflow-hidden bg-background">
      <SkipToMainContent />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block" aria-label="Main navigation">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={onToggleSidebar} items={sidebarItems} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <>
          <Box
            role="button"
            tabIndex={0}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onCloseMobileSidebar}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
                e.preventDefault()
                onCloseMobileSidebar()
              }
            }}
          />
          <aside className="fixed left-0 top-0 h-screen z-50 lg:hidden">
            <Sidebar isCollapsed={false} onToggle={onCloseMobileSidebar} items={sidebarItems} />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <Flex direction="column" className="flex-1 overflow-hidden">
        {/* Tab Bar */}
        <TabBar onMobileMenuClick={onToggleMobileSidebar} />

        {/* Action Ribbon - shows actions for active tab */}
        <ActionRibbon onAction={onTabAction} />

        {/* Main Content */}
        <main id="main-content" className="flex-1 overflow-y-auto" aria-label="Main content">
          <Container size="full" className="py-2 px-4">
            <Outlet />
          </Container>
        </main>
      </Flex>
    </Flex>
  )
}

/**
 * Minimal Layout - Tab Bar only, no sidebar
 * Used for focused work pages
 */
export function MinimalLayout({
  onTabAction = defaultMinimalLayoutProps.onTabAction,
}: MinimalLayoutProps = defaultMinimalLayoutProps) {
  return (
    <Flex className="h-screen overflow-hidden bg-background" direction="column">
      <SkipToMainContent />
      {/* Tab Bar */}
      <TabBar />

      {/* Action Ribbon - optional */}
      {onTabAction && <ActionRibbon onAction={onTabAction} />}

      {/* Main Content */}
      <main id="main-content" className="flex-1 overflow-y-auto" aria-label="Main content">
        <Container size="full" className="py-2 px-4">
          <Outlet />
        </Container>
      </main>
    </Flex>
  )
}

/**
 * Clean Layout - No navigation, just content
 * Used for login, error pages, modals, etc.
 */
export function CleanLayout() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <SkipToMainContent />
      <main id="main-content" className="h-full" aria-label="Main content">
        <Outlet />
      </main>
    </div>
  )
}

/**
 * Centered Layout - Centered content, no navigation
 * Used for login, registration, etc.
 */
export function CenteredLayout() {
  return (
    <div className="h-screen overflow-hidden bg-background">
      <SkipToMainContent />
      <main
        id="main-content"
        className="h-full flex items-center justify-center"
        aria-label="Main content"
      >
        <Outlet />
      </main>
    </div>
  )
}
