/**
 * Visual Alert
 * Visual indicators for audio alerts
 */

import { Box } from "@/components/ui/box";
import { useAccessibilityStore } from "@/stores/accessibilityStore";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";

export interface VisualAlertProps {
  message: string;
  type?: "info" | "warning" | "error" | "success";
  duration?: number;
}

export function VisualAlert({ message, type = "info", duration = 3000 }: VisualAlertProps) {
  const visualAlerts = useAccessibilityStore((state) => state.preferences.visualAlerts);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [duration]);

  useEffect(() => {
    if (visualAlerts) {
      // Flash screen for visual alert
      const flash = document.createElement("div");
      flash.className = "fixed inset-0 bg-white z-[9999] opacity-50 pointer-events-none";
      document.body.appendChild(flash);

      const timeout1 = setTimeout(() => {
        flash.style.transition = "opacity 0.3s";
        flash.style.opacity = "0";
        const timeout2 = setTimeout(() => {
          if (document.body.contains(flash)) {
            document.body.removeChild(flash);
          }
        }, 300);
        return () => clearTimeout(timeout2);
      }, 100);
      return () => {
        clearTimeout(timeout1);
        if (document.body.contains(flash)) {
          document.body.removeChild(flash);
        }
      };
    }
    return undefined;
  }, [visualAlerts, message]);

  if (!visible) {
    return null;
  }

  const typeClasses = {
    info: "bg-blue-500 text-white",
    warning: "bg-yellow-500 text-black",
    error: "bg-red-500 text-white",
    success: "bg-green-500 text-white",
  };

  return (
    <Box
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[10000] ${typeClasses[type]} px-4 py-2 rounded-md shadow-lg flex items-center gap-2`}
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-4 w-4" />
      <span className="text-sm font-medium">{message}</span>
    </Box>
  );
}
