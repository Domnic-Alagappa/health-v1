import { createRootRoute, Outlet, useLocation } from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/router-devtools"
import {
  Activity,
  BarChart3,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  Pill,
  Stethoscope,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import { ActionRibbon } from "@/components/ActionRibbon"
import { Sidebar } from "@/components/Sidebar"
import { TabBar } from "@/components/TabBar"
import { TabProvider, useTabs } from "@/contexts/TabContext"

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponentInner() {
  const location = useLocation()
  const { tabs, activeTabId, openTab, setActiveTab } = useTabs()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  // Helper function to get icon for a path
  const getIconForPath = (path: string): React.ReactNode => {
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
    }

    // Find matching icon by path prefix
    for (const [key, icon] of Object.entries(iconMap)) {
      if (path.startsWith(key)) {
        return icon
      }
    }

    return <FileText className="h-4 w-4" /> // Default icon
  }

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
        })

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
  }, [location.search, location.pathname, openTab]) // Run when location changes or on mount

  // Sync active tab with router location when navigating via browser back/forward
  useEffect(() => {
    const currentTab = tabs.find((t) => t.path === location.pathname)
    if (currentTab && currentTab.id !== activeTabId) {
      setActiveTab(currentTab.id)
    }
  }, [location.pathname, tabs, activeTabId, setActiveTab])

  // Update browser tab title when active tab changes
  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId)
    if (activeTab) {
      document.title = `${activeTab.label} - EHR Platform`
    } else {
      document.title = "EHR Platform"
    }
  }, [tabs, activeTabId])

  const handleNavClick = (path: string, label: string, icon: React.ReactNode) => {
    openTab({
      label,
      path,
      icon,
      closable: path !== "/",
    })
    // Close mobile sidebar after navigation
    setIsMobileSidebarOpen(false)
  }

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
          })
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

  const navigationItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: <Stethoscope className="h-5 w-5" />,
      onClick: () => handleNavClick("/", "Dashboard", <Stethoscope className="h-4 w-4" />),
      isActive: location.pathname === "/",
    },
    {
      path: "/patients",
      label: "Patients",
      icon: <Users className="h-5 w-5" />,
      onClick: () => handleNavClick("/patients", "Patients", <Users className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/patients"),
    },
    {
      path: "/clinical",
      label: "Clinical",
      icon: <FileText className="h-5 w-5" />,
      onClick: () => handleNavClick("/clinical", "Clinical", <FileText className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/clinical"),
    },
    {
      path: "/orders",
      label: "Orders",
      icon: <ClipboardList className="h-5 w-5" />,
      onClick: () => handleNavClick("/orders", "Orders", <ClipboardList className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/orders"),
    },
    {
      path: "/results",
      label: "Results",
      icon: <Activity className="h-5 w-5" />,
      onClick: () => handleNavClick("/results", "Results", <Activity className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/results"),
    },
    {
      path: "/scheduling",
      label: "Scheduling",
      icon: <Calendar className="h-5 w-5" />,
      onClick: () => handleNavClick("/scheduling", "Scheduling", <Calendar className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/scheduling"),
    },
    {
      path: "/pharmacy",
      label: "Pharmacy",
      icon: <Pill className="h-5 w-5" />,
      onClick: () => handleNavClick("/pharmacy", "Pharmacy", <Pill className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/pharmacy"),
    },
    {
      path: "/revenue",
      label: "Revenue",
      icon: <CreditCard className="h-5 w-5" />,
      onClick: () => handleNavClick("/revenue", "Revenue", <CreditCard className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/revenue"),
    },
    {
      path: "/analytics",
      label: "Analytics",
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => handleNavClick("/analytics", "Analytics", <BarChart3 className="h-4 w-4" />),
      isActive: location.pathname.startsWith("/analytics"),
    },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          items={navigationItems}
        />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <>
          <div
            role="button"
            tabIndex={0}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsMobileSidebarOpen(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
                e.preventDefault()
                setIsMobileSidebarOpen(false)
              }
            }}
          />
          <aside className="fixed left-0 top-0 h-screen z-50 lg:hidden">
            <Sidebar
              isCollapsed={false}
              onToggle={() => setIsMobileSidebarOpen(false)}
              items={navigationItems}
            />
          </aside>
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tab Bar */}
        <TabBar onMobileMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} />

        {/* Action Ribbon - shows actions for active tab */}
        <ActionRibbon onAction={handleTabAction} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <Outlet />
          </div>
        </main>
      </div>

      <TanStackRouterDevtools />
    </div>
  )
}

// Wrap with TabProvider inside router context
function RootComponent() {
  return (
    <TabProvider>
      <RootComponentInner />
    </TabProvider>
  )
}
