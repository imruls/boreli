"use client";

import { useTransition, useState } from "react";
import { Download } from "lucide-react";
import { ListRow } from "@/components/ui/list";
import { exportLibraryCsv } from "@/app/(dashboard)/actions";

// El CSV se arma en el server (RLS + acceso a Supabase); acá solo se
// convierte a Blob y se dispara la descarga, que es 100% cosa del navegador.
function downloadCsvFile(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function ExportLibraryButton() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleExport() {
    setError(null);
    startTransition(async () => {
      try {
        const { filename, csv } = await exportLibraryCsv();
        downloadCsvFile(filename, csv);
      } catch {
        setError("No pudimos exportar tu biblioteca. Probá de nuevo.");
      }
    });
  }

  // Fila de lista (va dentro de una `ListSection`); el error se muestra como
  // texto secundario de la misma fila.
  return (
    <ListRow
      icon={Download}
      label={isPending ? "Exportando…" : "Exportar biblioteca (CSV)"}
      description={error ? <span className="text-destructive">{error}</span> : undefined}
      disabled={isPending}
      onClick={handleExport}
    />
  );
}
