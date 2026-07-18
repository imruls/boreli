"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ProgressInput, type ProgressValue } from "@/components/books/progress-input";

// Sheet liviano para el acceso rápido de "Actualizar progreso" en la card de
// "Leyendo actualmente": a diferencia de `EditBookSheet`, no toca
// status/tags/rating, solo el progreso — para no obligar a abrir el sheet
// completo cada vez que se quiere anotar cuántas páginas se avanzó.
// El padre debe pasar una `key` distinta por libro para que el estado
// interno se reinicie al cambiar de libro (mismo criterio que `EditBookSheet`).
export function UpdateProgressSheet({
  open,
  onOpenChange,
  bookTitle,
  bookPageCount,
  currentProgress,
  onSave,
  isSaving = false,
  error = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle?: string;
  bookPageCount?: number | null;
  currentProgress: ProgressValue;
  onSave?: (value: ProgressValue) => void;
  isSaving?: boolean;
  error?: string | null;
}) {
  const [value, setValue] = useState<ProgressValue>(currentProgress);

  const canSave =
    value.progressType === null ||
    (value.progressCurrent !== null &&
      (value.progressType === "percent" || Boolean(value.progressTotalPages)));

  function handleOpenChange(next: boolean) {
    if (isSaving) return;
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-ink-border">
        <SheetHeader>
          <SheetTitle className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Actualizar progreso
          </SheetTitle>
          {bookTitle ? <p className="text-sm font-medium text-ink">{bookTitle}</p> : null}
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <ProgressInput value={value} onChange={setValue} bookPageCount={bookPageCount} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <SheetFooter>
          <Button disabled={!canSave || isSaving} onClick={() => onSave?.(value)}>
            {isSaving ? "Guardando…" : "Guardar"}
          </Button>
          <Button variant="outline" disabled={isSaving} onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
