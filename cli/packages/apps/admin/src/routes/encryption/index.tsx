import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

/**
 * Encryption Index Page
 * Redirects to DEK Management as the default encryption page
 */
export function EncryptionIndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/encryption/deks" });
  }, [navigate]);

  return null;
}

