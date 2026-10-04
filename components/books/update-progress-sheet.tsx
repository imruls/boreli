"use client";

import { useState } from "react";
import { Sheet, SheetBody, SheetContent, SheetNavBar } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ListItem, ListSection } from "@/components/ui/list";
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
      <SheetContent>
        <SheetNavBar
          title="Progreso"
          leading={
            <Button
              variant="ghost"
              className="font-normal"
              disabled={isSaving}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
          }
          trailing={
            <Button
              variant="ghost"
              disabled={!canSave}
              pending={isSaving}
              onClick={() => onSave?.(value)}
            >
              Guardar
            </Button>
          }
        />
        <SheetBody>
          {bookTitle ? (
            <p className="text-center text-subheadline text-label-secondary">{bookTitle}</p>
          ) : null}
          <ListSection footer={error ? <span className="text-destructive">{error}</span> : undefined}>
            <ListItem>
              <ProgressInput value={value} onChange={setValue} bookPageCount={bookPageCount} />
            </ListItem>
          </ListSection>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
