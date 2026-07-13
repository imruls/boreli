"use client";

import { useState, useTransition } from "react";
import { MoreVertical } from "lucide-react";
import { ChangeStatusSheet } from "@/components/books/change-status-sheet";
import { changeBookStatus } from "@/app/(dashboard)/actions";
import type { BookStatus } from "@/types/book";

// Trigger "⋯" autocontenido: cada card lo usa como su `action` (ver
// `book-card.tsx`) y administra su propio sheet/estado de guardado, así el
// padre (home / listas) no necesita levantar estado por libro.
export function BookStatusMenuButton({
  userBookId,
  bookTitle,
  currentStatus,
}: {
  userBookId: string;
  bookTitle: string;
  currentStatus: BookStatus;
}) {
  const [open, setOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleConfirm(status: BookStatus, rating?: number) {
    setError(null);
    startSaving(async () => {
      try {
        await changeBookStatus(userBookId, status, rating);
        setOpen(false);
      } catch {
        setError("No pudimos actualizar el libro. Probá de nuevo.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Cambiar estado de ${bookTitle}`}
        className="flex size-8 items-center justify-center rounded-full text-ink-muted hover:bg-ink-border/40"
      >
        <MoreVertical className="size-4" />
      </button>

      <ChangeStatusSheet
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setError(null);
        }}
        bookTitle={bookTitle}
        currentStatus={currentStatus}
        onConfirm={handleConfirm}
        isSaving={isSaving}
        error={error}
      />
    </>
  );
}
