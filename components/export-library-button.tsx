"use client";

import { useTransition, useState } from "react";
import { Download } from "lucide-react";
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

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleExport}
        disabled={isPending}
        className="flex w-full items-center gap-3 border-b border-ink-border py-3 text-left text-sm font-medium text-ink disabled:opacity-50"
      >
        <Download className="size-4 text-ink-muted" />
        {isPending ? "Exportando…" : "Exportar biblioteca (CSV)"}
      </button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
