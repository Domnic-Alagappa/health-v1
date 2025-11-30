/**
 * Error Boundary
 * Catches errors and displays sanitized error messages (no PHI)
 */

import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stack } from "@/components/ui/stack";
import { AlertCircle } from "lucide-react";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error securely (sanitized, no PHI)
    console.error("Error caught by boundary:", {
      message: this.sanitizeError(error.message),
      stack: error.stack ? this.sanitizeError(error.stack) : undefined,
      componentStack: errorInfo.componentStack,
    });
  }

  sanitizeError(message: string): string {
    // Remove email patterns
    message = message.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL]");

    // Remove SSN patterns
    message = message.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[SSN]");

    // Remove phone patterns
    message = message.replace(/\b\d{3}-\d{3}-\d{4}\b/g, "[PHONE]");

    return message;
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="p-6 m-4">
          <Stack spacing="md" align="center">
            <Box className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </Box>

            <Stack spacing="sm" align="center">
              <h2 className="text-xl font-semibold">Something went wrong</h2>
              <p className="text-sm text-muted-foreground text-center">
                An error occurred while rendering this component.
              </p>
              {this.state.error && (
                <Box className="text-xs text-muted-foreground font-mono p-2 bg-muted rounded">
                  {this.sanitizeError(this.state.error.message)}
                </Box>
              )}
            </Stack>

            <Button onClick={this.handleReset} variant="outline">
              Try Again
            </Button>
          </Stack>
        </Card>
      );
    }

    return this.props.children;
  }
}
