import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { AlertCircle, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Flex } from "@/components/ui/flex"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Stack } from "@/components/ui/stack"
import { useAuthStore } from "@/stores/authStore"

export const Route = createFileRoute("/login")({
  component: LoginPage,
})

function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, isAuthenticated } = useAuthStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/"
      navigate({ to: redirectTo as "/" })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    // Basic validation
    if (!email || !password) {
      setLocalError("Email and password are required")
      return
    }

    if (!email.includes("@")) {
      setLocalError("Please enter a valid email address")
      return
    }

    try {
      await login(email, password)
      // Navigation will happen via useEffect when isAuthenticated becomes true
      const redirectTo = new URLSearchParams(window.location.search).get("redirect") || "/"
      navigate({ to: redirectTo as "/" })
    } catch (err) {
      // Error is handled by auth store
      setLocalError(err instanceof Error ? err.message : "Login failed")
    }
  }

  const displayError = error || localError

  return (
    <Flex
      className="min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4"
      direction="column"
    >
      <Box className="w-full max-w-md space-y-8 rounded-lg border bg-card p-8 shadow-lg">
        <Stack spacing="lg">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">Sign In</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Stack spacing="md">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  autoComplete="current-password"
                />
              </div>
            </Stack>

            {displayError && (
              <div
                className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{displayError}</span>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Secure authentication powered by OIDC</p>
          </div>
        </Stack>
      </Box>
    </Flex>
  )
}
