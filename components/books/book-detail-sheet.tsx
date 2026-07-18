"use client";

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
import { BookTagBadge } from "@/components/books/book-tag-badge";
import { RatingStars } from "@/components/books/rating-stars";
import { ProgressBar } from "@/components/books/progress-bar";
import { hasProgress } from "@/lib/book-progress";
import type { BookStatus, BookTag, ProgressType } from "@/types/book";

const STATUS_INFO: Record<BookStatus, { label: string; icon: LucideIcon }> = {
  want_to_read: { label: "Quiero leer", icon: Clock },
  reading: { label: "Leyendo", icon: BookOpen },
  read: { label: "Leído", icon: CheckCircle2 },
};

// Sheet de solo lectura que se abre al tocar una card de la biblioteca (a
// diferencia del "⋯", que abre directo `EditBookSheet`). La reseña solo
// existe si `status === 'read'` (constraint `note_requires_read` en
// data-model.md), por eso ese bloque completo se omite para los demás
// estados en vez de mostrarlo vacío.
export function BookDetailSheet({
  open,
  onOpenChange,
  bookTitle,
  status,
  tags,
  rating,
  note,
  progressType,
  progressCurrent,
  progressTotalPages,
  onEdit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle?: string;
  status: BookStatus;
  tags: BookTag[];
  rating: number | null;
  note: string | null;
  progressType?: ProgressType | null;
  progressCurrent?: number | null;
  progressTotalPages?: number | null;
  onEdit?: () => void;
}) {
  const { label, icon: Icon } = STATUS_INFO[status];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-ink-border">
        <SheetHeader>
          <SheetTitle className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Detalle del libro
          </SheetTitle>
          {bookTitle ? <p className="text-sm font-medium text-ink">{bookTitle}</p> : null}
        </SheetHeader>

        <div className="flex flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-muted">Estado</span>
            <span className="flex items-center gap-2 text-sm font-medium text-ink">
              <Icon className="size-4 text-ink-muted" />
              {label}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-muted">Etiquetas</span>
            {tags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {tags.map((tag) => (
                  <BookTagBadge key={tag} tag={tag} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">Sin etiquetas</p>
            )}
          </div>

          {status === "reading" ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-muted">Progreso</span>
              {hasProgress({
                progressType: progressType ?? null,
                progressCurrent: progressCurrent ?? null,
              }) ? (
                <ProgressBar
                  progressType={progressType ?? null}
                  progressCurrent={progressCurrent ?? null}
                  progressTotalPages={progressTotalPages ?? null}
                />
              ) : (
                <p className="text-sm text-ink-muted">Todavía no registraste progreso.</p>
              )}
            </div>
          ) : null}

          {status === "read" ? (
            <>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">Calificación</span>
                {rating ? <RatingStars rating={rating} className="gap-1" /> : (
                  <p className="text-sm text-ink-muted">Sin calificación</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">Reseña</span>
                {note ? (
                  <p className="text-sm whitespace-pre-wrap text-ink">{note}</p>
                ) : (
                  <p className="text-sm text-ink-muted">Todavía no escribiste una reseña.</p>
                )}
              </div>
            </>
          ) : null}
        </div>

        <SheetFooter>
          <Button onClick={() => onEdit?.()}>Editar</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
