"use client";

import { useState, useTransition } from "react";
import { MoreVertical } from "lucide-react";
import { BookCard } from "@/components/books/book-card";
import { BookDetailSheet } from "@/components/books/book-detail-sheet";
import { EditBookSheet } from "@/components/books/edit-book-sheet";
import { BookTagBadge } from "@/components/books/book-tag-badge";
import { RatingStars } from "@/components/books/rating-stars";
import { updateUserBook, deleteUserBook } from "@/app/(dashboard)/actions";
import type { BookStatus, BookTag, UserBook } from "@/types/book";

// Card autocontenida para un libro ya en la biblioteca (home / quiero-leer /
// leídos): tocar la card abre el detalle de solo lectura (`BookDetailSheet`)
// y el "⋯" abre directo la edición (`EditBookSheet`), sin pasar por el
// detalle. El botón "⋯" corta la propagación del click para no disparar
// también el `onClick` de la card. Reemplaza al viejo `BookEditMenuButton`,
// que solo cubría el "⋯" y no el tap-to-detalle.
export function UserBookCard({
  userBook,
  showRating = false,
  coverSize = "sm",
}: {
  userBook: UserBook;
  showRating?: boolean;
  coverSize?: "sm" | "lg";
}) {
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave(status: BookStatus, tags: BookTag[], rating?: number, note?: string) {
    setError(null);
    startSaving(async () => {
      try {
        await updateUserBook(userBook.id, { status, tags, rating, note });
        setEditOpen(false);
      } catch {
        setError("No pudimos actualizar el libro. Probá de nuevo.");
      }
    });
  }

  function handleDelete() {
    setError(null);
    startDeleting(async () => {
      try {
        await deleteUserBook(userBook.id);
        setEditOpen(false);
      } catch {
        setError("No pudimos eliminar el libro. Probá de nuevo.");
      }
    });
  }

  return (
    <>
      <BookCard
        title={userBook.book.title}
        authors={userBook.book.authors}
        coverUrl={userBook.book.coverUrl}
        trustedCover={Boolean(userBook.book.googleBooksId)}
        coverSize={coverSize}
        onClick={() => setDetailOpen(true)}
        meta={
          userBook.tags.length > 0 || (showRating && userBook.rating) ? (
            <div className="flex flex-wrap items-center gap-2">
              {showRating && userBook.rating ? <RatingStars rating={userBook.rating} /> : null}
              {userBook.tags.map((tag) => (
                <BookTagBadge key={tag} tag={tag} />
              ))}
            </div>
          ) : undefined
        }
        action={
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setEditOpen(true);
            }}
            aria-label={`Editar ${userBook.book.title}`}
            className="flex size-8 items-center justify-center rounded-full text-ink-muted hover:bg-ink-border/40"
          >
            <MoreVertical className="size-4" />
          </button>
        }
      />

      <BookDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        bookTitle={userBook.book.title}
        status={userBook.status}
        tags={userBook.tags}
        rating={userBook.rating}
        note={userBook.note}
        onEdit={() => {
          setDetailOpen(false);
          setEditOpen(true);
        }}
      />

      <EditBookSheet
        open={editOpen}
        onOpenChange={(next) => {
          setEditOpen(next);
          if (!next) setError(null);
        }}
        bookTitle={userBook.book.title}
        currentStatus={userBook.status}
        currentTags={userBook.tags}
        currentRating={userBook.rating}
        currentNote={userBook.note}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={isSaving}
        isDeleting={isDeleting}
        error={error}
      />
    </>
  );
}
