"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/nav/page-header";
import { EmptyState } from "@/components/ui/empty-state";

// Boundary de errores para todo `/(dashboard)` (Next.js exige "use client" acá):
// cualquier excepción no controlada en un Server Component de esta sección
// (ej. una query de Supabase que falla) cae acá en vez del overlay genérico
// de Next. `reset()` reintenta el render del segmento sin recargar la página.
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard] Error no controlado", error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader title="Algo salió mal" />
      <EmptyState
        icon={AlertTriangle}
        title="No pudimos cargar esta pantalla"
        description="Ocurrió un error inesperado. Probá de nuevo en un momento."
        action={{ label: "Reintentar", onClick: reset }}
      />
    </div>
  );
}
