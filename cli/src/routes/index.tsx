import { createFileRoute } from "@tanstack/react-router"
import {
  Activity,
  AlertCircle,
  Calendar,
  ClipboardList,
  Clock,
  FileText,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTabs } from "@/contexts/TabContext"

export const Route = createFileRoute("/")({
  component: DashboardComponent,
})

function DashboardComponent() {
  const { openTab } = useTabs()

  const handleOpenModule = (path: string, label: string, icon: React.ReactNode) => {
    // Forms and multi-step processes allow duplicates (paths ending with /new, /create, etc.)
    const isFormPath = path.includes("/new") || path.includes("/create") || path.includes("/edit")
    openTab({
      label,
      path,
      icon,
      closable: path !== "/",
      allowDuplicate: isFormPath, // Allow multiple instances of forms
    })
  }
  const stats = [
    {
      title: "Active Patients",
      value: "1,247",
      change: "+12%",
      icon: Users,
      link: "/patients",
    },
    {
      title: "Pending Orders",
      value: "23",
      change: "-5%",
      icon: ClipboardList,
      link: "/orders",
      urgent: true,
    },
    {
      title: "Results Pending Review",
      value: "47",
      change: "+8%",
      icon: Activity,
      link: "/results",
    },
    {
      title: "Today's Appointments",
      value: "156",
      change: "+3%",
      icon: Calendar,
      link: "/scheduling",
    },
  ]

  const quickActions = [
    {
      title: "Register New Patient",
      description: "Add a new patient to the system",
      icon: Users,
      link: "/patients/new",
      color: "primary",
    },
    {
      title: "Create Clinical Note",
      description: "Document patient encounter",
      icon: FileText,
      link: "/clinical/new",
      color: "secondary",
    },
    {
      title: "Enter Order",
      description: "Place lab, radiology, or medication order",
      icon: ClipboardList,
      link: "/orders/new",
      color: "secondary",
    },
    {
      title: "Schedule Appointment",
      description: "Book patient appointment",
      icon: Calendar,
      link: "/scheduling/new",
      color: "secondary",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clinical Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back, Dr. John Doe. Here's your overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() =>
              handleOpenModule(stat.link, stat.title, <stat.icon className="h-4 w-4" />)
            }
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                {stat.urgent && (
                  <Badge variant="destructive" className="text-xs">
                    Urgent
                  </Badge>
                )}
                <span className={stat.change.startsWith("+") ? "text-green-600" : "text-red-600"}>
                  {stat.change} from last week
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card
              key={action.title}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                handleOpenModule(action.link, action.title, <action.icon className="h-4 w-4" />)
              }
            >
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <action.icon className="h-5 w-5 text-primary" />
                  {action.title}
                </CardTitle>
                <CardDescription>{action.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>

      {/* Alerts & Notifications */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Critical Alerts
            </CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Abnormal Lab Results</p>
                  <p className="text-sm text-muted-foreground">
                    3 results pending physician review
                  </p>
                </div>
                <Badge variant="destructive">3</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Medication Interactions</p>
                  <p className="text-sm text-muted-foreground">2 potential interactions detected</p>
                </div>
                <Badge variant="destructive">2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Tasks
            </CardTitle>
            <CardDescription>Today's pending tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Discharge Summaries</p>
                  <p className="text-sm text-muted-foreground">5 pending completion</p>
                </div>
                <Badge variant="secondary">5</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Clinical Notes</p>
                  <p className="text-sm text-muted-foreground">12 notes awaiting signature</p>
                </div>
                <Badge variant="secondary">12</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
