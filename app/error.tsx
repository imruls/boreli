"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

// Red de seguridad al nivel de `app/`, por si algún error escapa los
// boundaries más específicos de `(auth)` y `(dashboard)`.
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[root] Error no controlado", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col">
      <EmptyState
        icon={AlertTriangle}
        title="No pudimos cargar esta pantalla"
        description="Ocurrió un error inesperado. Probá de nuevo en un momento."
        action={{ label: "Reintentar", onClick: reset }}
      />
    </div>
  );
}
