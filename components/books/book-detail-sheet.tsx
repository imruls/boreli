"use client";

import { Sheet, SheetBody, SheetContent, SheetNavBar } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ListItem, ListRow, ListSection } from "@/components/ui/list";
import { BookTagBadge } from "@/components/books/book-tag-badge";
import { RatingStars } from "@/components/books/rating-stars";
import { ProgressBar } from "@/components/books/progress-bar";
import { hasProgress } from "@/lib/book-progress";
import { BOOK_STATUS_OPTIONS } from "@/lib/book-status";
import type { BookStatus, BookTag, ProgressType } from "@/types/book";

// Sheet de solo lectura que se abre al tocar una card de la biblioteca (a
// diferencia del "⋯", que abre directo `EditBookSheet`). La reseña solo
// existe si `status === 'read'` (constraint `note_requires_read` en
// data-model.md), por eso ese bloque completo se omite para los demás
// estados en vez de mostrarlo vacío. Como sheet de solo lectura, la barra
// lleva `Editar` y `Listo` en vez de Cancelar/Guardar.
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
  const statusOption = BOOK_STATUS_OPTIONS.find((option) => option.status === status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetNavBar
          title="Detalle"
          leading={
            <Button variant="ghost" className="font-normal" onClick={() => onEdit?.()}>
              Editar
            </Button>
          }
          trailing={
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Listo
            </Button>
          }
        />
        <SheetBody>
          {bookTitle ? (
            <p className="text-center text-headline text-label">{bookTitle}</p>
          ) : null}

          <ListSection>
            <ListRow icon={statusOption?.icon} label="Estado" detail={statusOption?.label} />
          </ListSection>

          <ListSection header="Etiquetas">
            <ListItem>
              {tags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {tags.map((tag) => (
                    <BookTagBadge key={tag} tag={tag} />
                  ))}
                </div>
              ) : (
                <p className="text-body text-label-secondary">Sin etiquetas</p>
              )}
            </ListItem>
          </ListSection>

          {status === "reading" ? (
            <ListSection header="Progreso">
              <ListItem>
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
                  <p className="text-body text-label-secondary">Todavía no registraste progreso.</p>
                )}
              </ListItem>
            </ListSection>
          ) : null}

          {status === "read" ? (
            <ListSection header="Tu opinión">
              <ListItem>
                {rating ? (
                  <RatingStars rating={rating} className="gap-1 [&_svg]:size-5" />
                ) : (
                  <p className="text-body text-label-secondary">Sin calificación</p>
                )}
              </ListItem>
              <ListItem>
                {note ? (
                  <p className="text-body whitespace-pre-wrap text-label">{note}</p>
                ) : (
                  <p className="text-body text-label-secondary">Todavía no escribiste una reseña.</p>
                )}
              </ListItem>
            </ListSection>
          ) : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
