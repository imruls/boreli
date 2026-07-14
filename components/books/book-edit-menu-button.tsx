"use client";

import { useState, useTransition } from "react";
import { MoreVertical } from "lucide-react";
import { EditBookSheet } from "@/components/books/edit-book-sheet";
import { updateUserBook, deleteUserBook } from "@/app/(dashboard)/actions";
import type { BookStatus, BookTag } from "@/types/book";

// Trigger "⋯" autocontenido: cada card lo usa como su `action` (ver
// `book-card.tsx`) y administra su propio sheet/estado de guardado, así el
// padre (home / listas) no necesita levantar estado por libro. Guardado y
// borrado usan `useTransition` separados porque son acciones independientes
// del mismo sheet (ver `edit-book-sheet.tsx`).
export function BookEditMenuButton({
  userBookId,
  bookTitle,
  currentStatus,
  currentTags,
  currentRating,
}: {
  userBookId: string;
  bookTitle: string;
  currentStatus: BookStatus;
  currentTags: BookTag[];
  currentRating: number | null;
}) {
  const [open, setOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave(status: BookStatus, tags: BookTag[], rating?: number) {
    setError(null);
    startSaving(async () => {
      try {
        await updateUserBook(userBookId, { status, tags, rating });
        setOpen(false);
      } catch {
        setError("No pudimos actualizar el libro. Probá de nuevo.");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startDeleting(async () => {
      try {
        await deleteUserBook(userBookId);
        setOpen(false);
      } catch {
        setError("No pudimos eliminar el libro. Probá de nuevo.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Editar ${bookTitle}`}
        className="flex size-8 items-center justify-center rounded-full text-ink-muted hover:bg-ink-border/40"
      >
        <MoreVertical className="size-4" />
      </button>

      <EditBookSheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError(null);
        }}
        bookTitle={bookTitle}
        currentStatus={currentStatus}
        currentTags={currentTags}
        currentRating={currentRating}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={isSaving}
        isDeleting={isDeleting}
        error={error}
      />
    </>
  );
}
