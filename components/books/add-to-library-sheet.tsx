"use client";

import { useState } from "react";
import { Sheet, SheetBody, SheetContent, SheetNavBar } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ListItem, ListSection } from "@/components/ui/list";
import { RatingInput } from "@/components/books/rating-input";
import { NoteInput } from "@/components/books/note-input";
import { TagSelector } from "@/components/books/tag-selector";
import { StatusPicker } from "@/components/books/status-picker";
import type { BookStatus, BookTag } from "@/types/book";

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
      <SheetContent>
        <SheetNavBar
          title="Agregar libro"
          leading={
            <Button
              variant="ghost"
              className="font-normal"
              disabled={isSaving}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
          }
          trailing={
            <Button variant="ghost" disabled={!canSave} pending={isSaving} onClick={handleSave}>
              Agregar
            </Button>
          }
        />
        <SheetBody>
          {bookTitle ? (
            <p className="text-center text-subheadline text-label-secondary">{bookTitle}</p>
          ) : null}

          <StatusPicker value={selectedStatus} onChange={setSelectedStatus} disabled={isSaving} />

          <ListSection header="Formato (opcional)">
            <ListItem>
              <TagSelector value={tags} onChange={setTags} />
            </ListItem>
          </ListSection>

          {needsRating ? (
            <ListSection header="Tu opinión" footer="La calificación es obligatoria para marcar el libro como leído.">
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
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
