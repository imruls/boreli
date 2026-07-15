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
import { NoteInput } from "@/components/books/note-input";
import { TagSelector } from "@/components/books/tag-selector";
import { cn } from "@/lib/utils";
import type { BookStatus, BookTag } from "@/types/book";

const OPTIONS: { status: BookStatus; label: string; icon: LucideIcon }[] = [
  { status: "want_to_read", label: "Quiero leer", icon: Clock },
  { status: "reading", label: "Leyendo", icon: BookOpen },
  { status: "read", label: "Leído", icon: CheckCircle2 },
];

// Mapea directo a los 3 status reales del modelo (want_to_read / reading /
// read) en vez de una "Biblioteca" ambigua. El tag de formato es opcional y
// multi-select (`tags` es un array en el modelo). El cierre del sheet lo
// decide el padre (`onOpenChange`) recién cuando el alta real termina bien.
// El estado se reinicia por remount: el padre debe pasar una `key` distinta
// por libro (ej. `key={book?.id}`) en vez de resetearlo acá con un efecto.
//
// El estado es seleccionable (no dispara la acción al tocarlo) porque, igual
// que en `EditBookSheet`, elegir "Leído" necesita habilitar el selector de
// rating antes de poder confirmar — un tap inmediato no deja lugar para eso.
export function AddToLibrarySheet({
  open,
  onOpenChange,
  bookTitle,
  onSelect,
  isSaving = false,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle?: string;
  onSelect?: (status: BookStatus, tags: BookTag[], rating?: number, note?: string) => void;
  isSaving?: boolean;
}) {
  const [selectedStatus, setSelectedStatus] = useState<BookStatus | null>(null);
  const [tags, setTags] = useState<BookTag[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const needsRating = selectedStatus === "read";
  const canSave = selectedStatus !== null && (!needsRating || rating !== null);

  function handleSave() {
    if (!canSave || !selectedStatus) return;
    onSelect?.(
      selectedStatus,
      tags,
      needsRating ? (rating as number) : undefined,
      needsRating ? note : undefined,
    );
  }

  return (
    <Sheet open={open} onOpenChange={(next) => !isSaving && onOpenChange(next)}>
      <SheetContent side="bottom" className="rounded-t-2xl border-ink-border">
        <SheetHeader>
          <SheetTitle className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Agregar a…
          </SheetTitle>
          {bookTitle ? <p className="text-sm font-medium text-ink">{bookTitle}</p> : null}
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-muted">Formato (opcional)</span>
            <TagSelector value={tags} onChange={setTags} />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-muted">Estado</span>
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
                  </button>
                );
              })}
            </div>
          </div>

          {needsRating ? (
            <>
              <div className="flex flex-col gap-1.5 rounded-lg border border-ink-border px-3 py-3">
                <span className="text-xs font-semibold text-ink-muted">
                  Calificación (obligatoria para marcar como leído)
                </span>
                <RatingInput value={rating} onChange={setRating} />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">Reseña (opcional)</span>
                <NoteInput value={note} onChange={setNote} />
              </div>
            </>
          ) : null}
        </div>

        <SheetFooter>
          <Button disabled={!canSave || isSaving} onClick={handleSave}>
            {isSaving ? "Agregando…" : "Agregar"}
          </Button>
          <Button variant="outline" disabled={isSaving} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
