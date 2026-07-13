"use client";

import { useState } from "react";
import { Clock, BookOpen, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RatingInput } from "@/components/books/rating-input";
import { cn } from "@/lib/utils";
import type { BookStatus } from "@/types/book";

const OPTIONS: { status: BookStatus; label: string; icon: LucideIcon }[] = [
  { status: "want_to_read", label: "Quiero leer", icon: Clock },
  { status: "reading", label: "Leyendo", icon: BookOpen },
  { status: "read", label: "Leído", icon: CheckCircle2 },
];

// A diferencia de `add-to-library-sheet.tsx` (cada opción dispara el alta al
// tocarla), acá elegir "Leído" requiere un segundo dato obligatorio (el
// rating), así que la selección de status queda en un estado intermedio
// dentro del mismo sheet y el alta real la dispara el botón "Confirmar".
// El padre debe pasar una `key` distinta por libro (ej. `key={userBook.id}`)
// para que este estado intermedio se reinicie al cambiar de libro.
export function ChangeStatusSheet({
  open,
  onOpenChange,
  bookTitle,
  currentStatus,
  onConfirm,
  isSaving = false,
  error = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle?: string;
  currentStatus: BookStatus;
  onConfirm?: (status: BookStatus, rating?: number) => void;
  isSaving?: boolean;
  error?: string | null;
}) {
  const [selectedStatus, setSelectedStatus] = useState<BookStatus>(currentStatus);
  const [rating, setRating] = useState<number | null>(null);

  const needsRating = selectedStatus === "read";
  const hasChanges = selectedStatus !== currentStatus;
  const canConfirm = hasChanges && (!needsRating || rating !== null);

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm?.(selectedStatus, needsRating ? (rating as number) : undefined);
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <SheetContent side="bottom" className="rounded-t-2xl border-ink-border">
        <SheetHeader>
          <SheetTitle className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Mover a…
          </SheetTitle>
          {bookTitle ? <p className="text-sm font-medium text-ink">{bookTitle}</p> : null}
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1">
            {OPTIONS.map(({ status, label, icon: Icon }) => {
              const isSelected = selectedStatus === status;
              return (
                <button
                  key={status}
                  type="button"
                  disabled={isSaving}
                  onClick={() => setSelectedStatus(status)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm font-medium text-ink disabled:opacity-50",
                    isSelected ? "bg-ink-border/40" : "hover:bg-ink-border/20",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg border bg-cream",
                      isSelected ? "border-ink" : "border-ink-border",
                    )}
                  >
                    <Icon className="size-4 text-ink" />
                  </span>
                  {label}
                  {status === currentStatus ? (
                    <span className="ml-auto text-xs font-normal text-ink-muted">Actual</span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {needsRating ? (
            <div className="flex flex-col gap-1.5 rounded-lg border border-ink-border px-3 py-3">
              <span className="text-xs font-semibold text-ink-muted">
                Calificación (obligatoria para marcar como leído)
              </span>
              <RatingInput value={rating} onChange={setRating} />
            </div>
          ) : null}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <SheetFooter>
          <Button disabled={!canConfirm || isSaving} onClick={handleConfirm}>
            {isSaving ? "Guardando…" : "Confirmar"}
          </Button>
          <Button variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
