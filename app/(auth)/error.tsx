"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

// Boundary de errores para `/(auth)` (login, signup, forgot-password, reset-password).
// Separado del de `/(dashboard)` porque este grupo no tiene Sidebar/TabBar.
export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[auth] Error no controlado", error);
  }, [error]);

  return (
    <EmptyState
      icon={AlertTriangle}
      title="No pudimos cargar esta pantalla"
      description="Ocurrió un error inesperado. Probá de nuevo en un momento."
      action={{ label: "Reintentar", onClick: reset }}
    />
  );
}
