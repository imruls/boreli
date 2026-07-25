"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RatingInput } from "@/components/books/rating-input";
import { NoteInput } from "@/components/books/note-input";
import { TagSelector } from "@/components/books/tag-selector";
import { ProgressInput, type ProgressValue } from "@/components/books/progress-input";
import { BOOK_STATUS_OPTIONS as OPTIONS } from "@/lib/book-status";
import { cn } from "@/lib/utils";
import type { BookStatus, BookTag, ProgressType } from "@/types/book";

// Sheet único de edición de una card ya en la biblioteca: reemplaza al viejo
// `ChangeStatusSheet` (solo status) y suma tags, rating (también para
// corregirlo o completarlo si el libro quedó "leído" sin puntuar) y borrado.
// El borrado no abre un modal separado (no hay `AlertDialog` en el repo):
// pisa el contenido del sheet con un paso de confirmación inline, mismo
// patrón de estado intermedio que ya usaba `ChangeStatusSheet` para el
// rating. El padre debe pasar una `key` distinta por libro (ej.
// `key={userBook.id}`) para que este estado se reinicie al cambiar de libro.
export function EditBookSheet({
  open,
  onOpenChange,
  bookTitle,
  bookPageCount,
  currentStatus,
  currentTags,
  currentRating,
  currentNote,
  currentProgressType,
  currentProgressCurrent,
  currentProgressTotalPages,
  onSave,
  onDelete,
  isSaving = false,
  isDeleting = false,
  error = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookTitle?: string;
  bookPageCount?: number | null;
  currentStatus: BookStatus;
  currentTags: BookTag[];
  currentRating: number | null;
  currentNote: string | null;
  currentProgressType?: ProgressType | null;
  currentProgressCurrent?: number | null;
  currentProgressTotalPages?: number | null;
  onSave?: (
    status: BookStatus,
    tags: BookTag[],
    rating?: number,
    note?: string,
    progress?: ProgressValue,
  ) => void;
  onDelete?: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  error?: string | null;
}) {
  const [selectedStatus, setSelectedStatus] = useState<BookStatus>(currentStatus);
  const [tags, setTags] = useState<BookTag[]>(currentTags);
  const [rating, setRating] = useState<number | null>(currentRating);
  const [note, setNote] = useState(currentNote ?? "");
  const [progress, setProgress] = useState<ProgressValue>({
    progressType: currentProgressType ?? null,
    progressCurrent: currentProgressCurrent ?? null,
    progressTotalPages: currentProgressTotalPages ?? null,
  });
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isBusy = isSaving || isDeleting;
  const needsRating = selectedStatus === "read";
  const showsProgress = selectedStatus === "reading";
  const canSaveProgress =
    progress.progressType === null ||
    (progress.progressCurrent !== null &&
      (progress.progressType === "percent" || Boolean(progress.progressTotalPages)));
  const canSave = (!needsRating || rating !== null) && (!showsProgress || canSaveProgress);

  function handleSave() {
    if (!canSave) return;
    onSave?.(
      selectedStatus,
      tags,
      needsRating ? (rating as number) : undefined,
      needsRating ? note : undefined,
      showsProgress ? progress : undefined,
    );
  }

  function handleOpenChange(next: boolean) {
    if (isBusy) return;
    if (!next) setConfirmingDelete(false);
    onOpenChange(next);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl border-ink-border">
        {confirmingDelete ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-xs font-bold tracking-wide text-ink-muted uppercase">
                Eliminar libro
              </SheetTitle>
              {bookTitle ? <p className="text-sm font-medium text-ink">{bookTitle}</p> : null}
            </SheetHeader>

            <div className="flex flex-col gap-2 px-4">
              <p className="text-sm text-ink-muted">
                ¿Eliminar este libro de tu biblioteca? Esta acción no se puede deshacer.
              </p>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
            </div>

            <SheetFooter>
              <Button variant="destructive" disabled={isDeleting} onClick={() => onDelete?.()}>
                {isDeleting ? "Eliminando…" : "Eliminar"}
              </Button>
              <Button
                variant="outline"
                disabled={isDeleting}
                onClick={() => setConfirmingDelete(false)}
              >
                Cancelar
              </Button>
            </SheetFooter>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="text-xs font-bold tracking-wide text-ink-muted uppercase">
                Editar libro
              </SheetTitle>
              {bookTitle ? <p className="text-sm font-medium text-ink">{bookTitle}</p> : null}
            </SheetHeader>

            <div className="flex flex-col gap-4 overflow-y-auto px-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">Estado</span>
                <div className="flex flex-col gap-1">
                  {OPTIONS.map(({ status, label, icon: Icon }) => {
                    const isSelected = selectedStatus === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        disabled={isBusy}
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
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">Formato</span>
                <TagSelector value={tags} onChange={setTags} />
              </div>

              {showsProgress ? (
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold text-ink-muted">
                    Progreso de lectura (opcional)
                  </span>
                  <ProgressInput
                    value={progress}
                    onChange={setProgress}
                    bookPageCount={bookPageCount}
                  />
                </div>
              ) : null}

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

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Separator />

              <Button
                type="button"
                variant="destructive"
                disabled={isBusy}
                onClick={() => setConfirmingDelete(true)}
                className="justify-start"
              >
                <Trash2 />
                Eliminar libro
              </Button>
            </div>

            <SheetFooter>
              <Button disabled={!canSave || isBusy} onClick={handleSave}>
                {isSaving ? "Guardando…" : "Guardar"}
              </Button>
              <Button variant="outline" disabled={isBusy} onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
