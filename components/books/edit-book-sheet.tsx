"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Sheet, SheetBody, SheetContent, SheetNavBar } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ListItem, ListRow, ListSection } from "@/components/ui/list";
import { ActionSheet } from "@/components/ui/action-sheet";
import { RatingInput } from "@/components/books/rating-input";
import { NoteInput } from "@/components/books/note-input";
import { TagSelector } from "@/components/books/tag-selector";
import { StatusPicker } from "@/components/books/status-picker";
import { ProgressInput, type ProgressValue } from "@/components/books/progress-input";
import type { BookStatus, BookTag, ProgressType } from "@/types/book";

// Sheet único de edición de una card ya en la biblioteca: estado, tags,
// progreso (si está "leyendo"), rating y reseña (si está "leído", también
// para corregirlo o completarlo) y borrado. El borrado se confirma con un
// action sheet destructivo (ver design-system.md → "Confirmaciones
// destructivas"). El padre debe pasar una `key` distinta por libro (ej.
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
      <SheetContent>
        <SheetNavBar
          title="Editar libro"
          leading={
            <Button
              variant="ghost"
              className="font-normal"
              disabled={isBusy}
              onClick={() => handleOpenChange(false)}
            >
              Cancelar
            </Button>
          }
          trailing={
            <Button
              variant="ghost"
              disabled={!canSave || isDeleting}
              pending={isSaving}
              onClick={handleSave}
            >
              Guardar
            </Button>
          }
        />
        <SheetBody>
          {bookTitle ? (
            <p className="text-center text-subheadline text-label-secondary">{bookTitle}</p>
          ) : null}

          <StatusPicker
            value={selectedStatus}
            onChange={setSelectedStatus}
            currentStatus={currentStatus}
            disabled={isBusy}
          />

          <ListSection header="Formato">
            <ListItem>
              <TagSelector value={tags} onChange={setTags} />
            </ListItem>
          </ListSection>

          {showsProgress ? (
            <ListSection header="Progreso de lectura (opcional)">
              <ListItem>
                <ProgressInput value={progress} onChange={setProgress} bookPageCount={bookPageCount} />
              </ListItem>
            </ListSection>
          ) : null}

          {needsRating ? (
            <ListSection
              header="Tu opinión"
              footer="La calificación es obligatoria para marcar el libro como leído."
            >
              <ListItem className="py-1">
                <RatingInput value={rating} onChange={setRating} className="-mx-2" />
              </ListItem>
              <ListItem>
                <NoteInput
                  value={note}
                  onChange={setNote}
                  textareaClassName="min-h-20 bg-transparent px-0 py-1 focus-visible:ring-0"
                />
              </ListItem>
            </ListSection>
          ) : null}

          {error ? <p className="px-4 text-footnote text-destructive">{error}</p> : null}

          <ListSection>
            <ListRow
              icon={Trash2}
              label={isDeleting ? "Eliminando…" : "Eliminar libro"}
              destructive
              disabled={isBusy}
              onClick={() => setConfirmingDelete(true)}
            />
          </ListSection>
        </SheetBody>

        <ActionSheet
          open={confirmingDelete}
          onOpenChange={setConfirmingDelete}
          title="¿Eliminar este libro de tu biblioteca?"
          message="Esta acción no se puede deshacer."
          actions={[{ label: "Eliminar libro", destructive: true, onSelect: () => onDelete?.() }]}
        />
      </SheetContent>
    </Sheet>
  );
}
