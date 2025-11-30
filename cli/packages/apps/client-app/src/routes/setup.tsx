import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { Box } from "@/components/ui/box"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flex } from "@/components/ui/flex"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Stack } from "@/components/ui/stack"
import { checkSetupStatus, initializeSetup } from "@/lib/api/setup"
import type { SetupRequest } from "@/lib/api/setup"

export const Route = createFileRoute("/setup")({
  component: SetupPage,
})

function SetupPage() {
  const navigate = useNavigate()
  const [isChecking, setIsChecking] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<SetupRequest>({
    organization_name: "",
    organization_slug: "",
    organization_domain: "",
    admin_email: "",
    admin_username: "",
    admin_password: "",
  })

  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Check setup status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkSetupStatus()
        if (status.setup_completed) {
          // Setup already completed, redirect to login
          navigate({ to: "/login" })
        } else {
          setIsChecking(false)
        }
      } catch (err) {
        // If API is not available, allow setup to proceed
        console.warn("Could not check setup status:", err)
        setIsChecking(false)
      }
    }

    checkStatus()
  }, [navigate])

  // Calculate password strength
  useEffect(() => {
    const password = formData.admin_password
    if (!password) {
      setPasswordStrength(0)
      return
    }

    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    setPasswordStrength(strength)
  }, [formData.admin_password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    // Validation
    if (!formData.organization_name.trim()) {
      setError("Organization name is required")
      return
    }

    if (!formData.organization_slug.trim()) {
      setError("Organization slug is required")
      return
    }

    if (!/^[a-z0-9-]+$/.test(formData.organization_slug)) {
      setError("Organization slug must contain only lowercase letters, numbers, and hyphens")
      return
    }

    if (!formData.admin_email.trim() || !formData.admin_email.includes("@")) {
      setError("Valid admin email is required")
      return
    }

    if (!formData.admin_username.trim()) {
      setError("Admin username is required")
      return
    }

    if (formData.admin_password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (formData.admin_password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (passwordStrength < 3) {
      setError("Password is too weak. Please use a stronger password.")
      return
    }

    setIsSubmitting(true)

    try {
      const request: SetupRequest = {
        organization_name: formData.organization_name.trim(),
        organization_slug: formData.organization_slug.trim(),
        organization_domain: formData.organization_domain?.trim() || undefined,
        admin_email: formData.admin_email.trim(),
        admin_username: formData.admin_username.trim(),
        admin_password: formData.admin_password,
      }

      await initializeSetup(request)
      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate({ to: "/login" })
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPasswordStrengthLabel = () => {
    if (passwordStrength === 0) return ""
    if (passwordStrength <= 2) return "Weak"
    if (passwordStrength <= 4) return "Medium"
    return "Strong"
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-destructive"
    if (passwordStrength <= 4) return "bg-warning"
    return "bg-success"
  }

  if (isChecking) {
    return (
      <Flex className="min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Flex>
    )
  }

  if (success) {
    return (
      <Flex className="min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Setup Complete
            </CardTitle>
            <CardDescription>Your system has been initialized successfully.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Redirecting to login page...
            </p>
          </CardContent>
        </Card>
      </Flex>
    )
  }

  return (
    <Flex
      className="min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4"
      direction="column"
    >
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Initial Setup</CardTitle>
          <CardDescription>
            Configure your organization and create the first super admin user. This is a one-time
            setup process.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Stack spacing="lg">
              <div>
                <h3 className="mb-4 text-lg font-semibold">Organization Details</h3>
                <Stack spacing="md">
                  <div className="space-y-2">
                    <Label htmlFor="organization_name">Organization Name *</Label>
                    <Input
                      id="organization_name"
                      type="text"
                      placeholder="Acme Healthcare"
                      value={formData.organization_name}
                      onChange={(e) =>
                        setFormData({ ...formData, organization_name: e.target.value })
                      }
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization_slug">Organization Slug *</Label>
                    <Input
                      id="organization_slug"
                      type="text"
                      placeholder="acme-healthcare"
                      value={formData.organization_slug}
                      onChange={(e) =>
                        setFormData({ ...formData, organization_slug: e.target.value.toLowerCase() })
                      }
                      disabled={isSubmitting}
                      required
                      pattern="[a-z0-9-]+"
                    />
                    <p className="text-xs text-muted-foreground">
                      Lowercase letters, numbers, and hyphens only
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization_domain">Organization Domain (Optional)</Label>
                    <Input
                      id="organization_domain"
                      type="text"
                      placeholder="acme.com"
                      value={formData.organization_domain}
                      onChange={(e) =>
                        setFormData({ ...formData, organization_domain: e.target.value })
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                </Stack>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">Super Admin Account</h3>
                <Stack spacing="md">
                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Admin Email *</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      placeholder="admin@example.com"
                      value={formData.admin_email}
                      onChange={(e) =>
                        setFormData({ ...formData, admin_email: e.target.value })
                      }
                      disabled={isSubmitting}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_username">Admin Username *</Label>
                    <Input
                      id="admin_username"
                      type="text"
                      placeholder="admin"
                      value={formData.admin_username}
                      onChange={(e) =>
                        setFormData({ ...formData, admin_username: e.target.value })
                      }
                      disabled={isSubmitting}
                      required
                      autoComplete="username"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_password">Admin Password *</Label>
                    <Input
                      id="admin_password"
                      type="password"
                      placeholder="Enter a strong password"
                      value={formData.admin_password}
                      onChange={(e) =>
                        setFormData({ ...formData, admin_password: e.target.value })
                      }
                      disabled={isSubmitting}
                      required
                      autoComplete="new-password"
                    />
                    {formData.admin_password && (
                      <div className="space-y-1">
                        <div className="flex h-2 gap-1">
                          {[1, 2, 3, 4, 5, 6].map((level) => (
                            <div
                              key={level}
                              className={`h-full flex-1 rounded ${
                                level <= passwordStrength
                                  ? getPasswordStrengthColor()
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Strength: {getPasswordStrengthLabel()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm Password *</Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isSubmitting}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </Stack>
              </div>

              {error && (
                <div
                  className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive"
                  role="alert"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </Stack>
          </form>
        </CardContent>
      </Card>
    </Flex>
  )
}

