import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"
import {
  Activity,
  BarChart3,
  Calendar,
  ClipboardList,
  CreditCard,
  FileEdit,
  FileText,
  Pill,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react"
import { useCallback, useEffect, useMemo } from "react"
import { useNavigate } from "@tanstack/react-router"
import { ActionRibbon } from "@/components/ActionRibbon"
import { Sidebar } from "@/components/layout/Sidebar"
import { TabBar } from "@/components/layout/TabBar"
import { Box } from "@/components/ui/box"
import { Container } from "@/components/ui/container"
import { Flex } from "@/components/ui/flex"
import { SkipToMainContent } from "@/lib/accessibility"
import { useAuthStore } from "@/stores/authStore"
import { useTabs, useActiveTabId, useOpenTab, useSetActiveTab } from "@/stores/tabStore"
import { useSidebarCollapsed, useSetSidebarCollapsed } from "@/stores/uiStore"
import { useDisclosure } from "@/hooks/ui/useDisclosure"
import { PERMISSIONS, type Permission } from "@/lib/constants/permissions"

export const Route = createRootRoute({
  component: RootComponent,
})

// Helper function to get icon for a path
function getIconForPath(path: string): React.ReactNode {
  const iconMap: Record<string, React.ReactNode> = {
    "/": <Stethoscope className="h-4 w-4" />,
    "/patients": <Users className="h-4 w-4" />,
    "/clinical": <FileText className="h-4 w-4" />,
    "/orders": <ClipboardList className="h-4 w-4" />,
    "/results": <Activity className="h-4 w-4" />,
    "/scheduling": <Calendar className="h-4 w-4" />,
    "/pharmacy": <Pill className="h-4 w-4" />,
    "/revenue": <CreditCard className="h-4 w-4" />,
    "/analytics": <BarChart3 className="h-4 w-4" />,
    "/form-builder": <FileEdit className="h-4 w-4" />,
    "/settings": <Settings className="h-4 w-4" />,
  }

  // Find matching icon by path prefix
  for (const [key, icon] of Object.entries(iconMap)) {
    if (path.startsWith(key)) {
      return icon
    }
  }

  return <FileText className="h-4 w-4" /> // Default icon
}

function RootComponentInner() {
  const location = useLocation()
  const navigate = useNavigate()
  const tabs = useTabs()
  const activeTabId = useActiveTabId()
  const openTab = useOpenTab()
  const setActiveTab = useSetActiveTab()
  const isSidebarCollapsed = useSidebarCollapsed()
  const setIsSidebarCollapsed = useSetSidebarCollapsed()
  const { isOpen: isMobileSidebarOpen, onClose: onMobileSidebarClose, onToggle: onMobileSidebarToggle } = useDisclosure('mobile-sidebar')

  // Check for standalone tab on mount (when window is opened from drag-out)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const tabToken = urlParams.get("_tab")

    if (tabToken) {
      try {
        // Retrieve tab data from sessionStorage using token (single-use, secure)
        const tabDataKey = `_tab_${tabToken}`
        const expiresKey = `_tab_${tabToken}_expires`

        const tabDataStr = sessionStorage.getItem(tabDataKey)
        const expiresStr = sessionStorage.getItem(expiresKey)

        if (!tabDataStr) {
          // Token not found or already used - clean up and exit
          if (expiresStr) {
            sessionStorage.removeItem(expiresKey)
          }
          // Clean up URL param
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete("_tab")
          window.history.replaceState({}, "", newUrl.toString())
          return
        }

        // Check expiration
        if (expiresStr && Date.now() > parseInt(expiresStr, 10)) {
          // Token expired - clean up
          sessionStorage.removeItem(tabDataKey)
          sessionStorage.removeItem(expiresKey)
          const newUrl = new URL(window.location.href)
          newUrl.searchParams.delete("_tab")
          window.history.replaceState({}, "", newUrl.toString())
          return
        }

        const tabData = JSON.parse(tabDataStr)

        // Open the tab automatically with the correct icon
        openTab({
          label: tabData.label,
          path: tabData.path || location.pathname,
          icon: getIconForPath(tabData.path || location.pathname),
          closable: tabData.closable !== false && (tabData.path || location.pathname) !== "/",
          allowDuplicate: tabData.allowDuplicate || false,
        }, (path) => navigate({ to: path as "/" | (string & {}) }))

        // Immediately delete the token (single-use security measure)
        // This prevents token reuse if URL is shared or bookmarked
        sessionStorage.removeItem(tabDataKey)
        sessionStorage.removeItem(expiresKey)

        // Clean up URL param without reload (for cleaner URL and security)
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete("_tab")
        window.history.replaceState({}, "", newUrl.toString())
      } catch (err) {
        console.error("Error restoring standalone tab:", err)
        // On error, try to clean up
        try {
          sessionStorage.removeItem(`_tab_${tabToken}`)
          sessionStorage.removeItem(`_tab_${tabToken}_expires`)
        } catch (_cleanupErr) {
          // Ignore cleanup errors
        }
      }
    }
  }, [location.search, location.pathname, openTab, navigate]) // Run when location changes or on mount

  // Sync active tab with router location when navigating via browser back/forward
  useEffect(() => {
    const currentTab = tabs.find((t) => t.path === location.pathname)
    if (currentTab && currentTab.id !== activeTabId) {
      setActiveTab(currentTab.id, (path) => navigate({ to: path as "/" | (string & {}) }))
    }
  }, [location.pathname, tabs, activeTabId, setActiveTab, navigate])

  // Update browser tab title when active tab changes
  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId)
    if (activeTab) {
      document.title = `${activeTab.label} - EHR Platform`
    } else {
      document.title = "EHR Platform"
    }
  }, [tabs, activeTabId])

  const handleNavClick = useCallback((path: string, label: string, icon: React.ReactNode) => {
    // Get required permission for this route - use static map to avoid circular dependency
    const routePermissionMap: Record<string, Permission | undefined> = {
      '/': undefined,
      '/patients': PERMISSIONS.PATIENTS.VIEW,
      '/clinical': PERMISSIONS.CLINICAL.VIEW,
      '/orders': PERMISSIONS.ORDERS.VIEW,
      '/results': PERMISSIONS.RESULTS.VIEW,
      '/scheduling': PERMISSIONS.SCHEDULING.VIEW,
      '/pharmacy': PERMISSIONS.PHARMACY.VIEW,
      '/revenue': PERMISSIONS.REVENUE.VIEW,
      '/analytics': PERMISSIONS.ANALYTICS.VIEW,
      '/form-builder': undefined,
      '/settings': PERMISSIONS.SETTINGS.VIEW,
    }
    const requiredPermission = routePermissionMap[path]
    
    openTab({
      label,
      path,
      icon,
      closable: path !== "/",
      requiredPermission,
    }, (path) => navigate({ to: path as "/" | (string & {}) }))
    // Close mobile sidebar after navigation
    onMobileSidebarClose()
  }, [openTab, navigate, onMobileSidebarClose])

  const handleTabAction = (actionId: string, tabPath: string) => {
    // Handle different actions
    switch (actionId) {
      case "refresh":
        // Reload the current tab
        window.location.reload()
        break
      case "duplicate": {
        // Open the same path in a new tab
        const tabToDuplicate = tabs.find((t) => t.path === tabPath)
        if (tabToDuplicate) {
          openTab({
            label: `${tabToDuplicate.label} (Copy)`,
            path: tabPath,
            icon: tabToDuplicate.icon,
            closable: true,
          }, (path) => navigate({ to: path as "/" | (string & {}) }))
        }
        break
      }
      case "view-details":
      case "edit-patient":
      case "new-note":
      case "schedule":
      case "view-results":
      case "view-medications":
      case "new-patient":
      case "new-order":
      case "view-pending":
      case "export":
      case "print":
      case "link-actions":
      case "view-templates":
        // These actions would typically navigate or open modals
        // For now, we'll log them - you can implement specific handlers
        console.log(`Action: ${actionId} for path: ${tabPath}`)
        // Example: You could dispatch an event or call a callback here
        break
      default:
        console.log(`Unknown action: ${actionId}`)
    }
  }

  // Define navigation items with permissions
  const allNavigationItems = useMemo<Array<{
    path: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    isActive: boolean;
    permission?: Permission;
  }>>(() => [
    {
      path: "/",
      label: "Dashboard",
      icon: <Stethoscope className="h-5 w-5" />,
      onClick: () => handleNavClick("/", "Dashboard", <Stethoscope className="h-4 w-4" />),
      isActive: location.pathname === "/",
      permission: undefined, // Dashboard is always accessible
    },
    {
      path: "/patients",
      label: "Patients",
      icon: <Users className="h-5 w-5" />,
      onClick: () => handleNavClick("/patients", "Patients", <Users className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/patients"),
      permission: PERMISSIONS.PATIENTS.VIEW,
    },
    {
      path: "/clinical",
      label: "Clinical",
      icon: <FileText className="h-5 w-5" />,
      onClick: () => handleNavClick("/clinical", "Clinical", <FileText className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/clinical"),
      permission: PERMISSIONS.CLINICAL.VIEW,
    },
    {
      path: "/orders",
      label: "Orders",
      icon: <ClipboardList className="h-5 w-5" />,
      onClick: () => handleNavClick("/orders", "Orders", <ClipboardList className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/orders"),
      permission: PERMISSIONS.ORDERS.VIEW,
    },
    {
      path: "/results",
      label: "Results",
      icon: <Activity className="h-5 w-5" />,
      onClick: () => handleNavClick("/results", "Results", <Activity className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/results"),
      permission: PERMISSIONS.RESULTS.VIEW,
    },
    {
      path: "/scheduling",
      label: "Scheduling",
      icon: <Calendar className="h-5 w-5" />,
      onClick: () => handleNavClick("/scheduling", "Scheduling", <Calendar className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/scheduling"),
      permission: PERMISSIONS.SCHEDULING.VIEW,
    },
    {
      path: "/pharmacy",
      label: "Pharmacy",
      icon: <Pill className="h-5 w-5" />,
      onClick: () => handleNavClick("/pharmacy", "Pharmacy", <Pill className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/pharmacy"),
      permission: PERMISSIONS.PHARMACY.VIEW,
    },
    {
      path: "/revenue",
      label: "Revenue",
      icon: <CreditCard className="h-5 w-5" />,
      onClick: () => handleNavClick("/revenue", "Revenue", <CreditCard className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/revenue"),
      permission: PERMISSIONS.REVENUE.VIEW,
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => handleNavClick("/analytics", "Analytics", <BarChart3 className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/analytics"),
      permission: PERMISSIONS.ANALYTICS.VIEW,
    },
    {
      path: "/form-builder",
      label: "Form Builder",
      icon: <FileEdit className="h-5 w-5" />,
      onClick: () =>
        handleNavClick("/form-builder", "Form Builder", <FileEdit className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/form-builder"),
      permission: undefined, // Form builder might not need specific permission
    },
    {
      path: "/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      onClick: () => handleNavClick("/settings", "Settings", <Settings className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/settings"),
      permission: PERMISSIONS.SETTINGS.VIEW,
    },
  ], [location.pathname, handleNavClick])

  // Filter navigation items based on permissions
  // Use direct store access to avoid hook re-render issues
  const navigationItems = useMemo(() => {
    const state = useAuthStore.getState()
    return allNavigationItems.filter((item) => {
      if (!item.permission) return true // No permission required
      return state.permissions.includes(item.permission)
    })
  }, [allNavigationItems]) // Filter based on navigation items and permissions

  return (
    <Flex className="h-screen overflow-hidden bg-background">
      <SkipToMainContent />
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block" aria-label="Main navigation">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          items={navigationItems}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <>
          <Box
            role="button"
            tabIndex={0}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onMobileSidebarClose}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
                e.preventDefault()
                onMobileSidebarClose()
              }
            }}
          />
          <aside className="fixed left-0 top-0 h-screen z-50 lg:hidden">
            <Sidebar
              isCollapsed={false}
              onToggle={onMobileSidebarClose}
              items={navigationItems}
            />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <Flex direction="column" className="flex-1 overflow-hidden">
        {/* Tab Bar */}
        <TabBar onMobileMenuClick={onMobileSidebarToggle} />

        {/* Action Ribbon - shows actions for active tab */}
        <ActionRibbon onAction={handleTabAction} />

        {/* Main Content */}
        <main id="main-content" className="flex-1 overflow-y-auto" aria-label="Main content">
          <Container size="full" className="py-2 px-4">
            <Outlet />
          </Container>
        </main>
      </Flex>

      <TanStackRouterDevtools />
    </Flex>
  )
}

// Root component - no longer needs TabProvider
function RootComponent() {
  return <RootComponentInner />
}
