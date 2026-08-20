"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical } from "lucide-react";
import { BookCard } from "@/components/books/book-card";
import { BookDetailSheet } from "@/components/books/book-detail-sheet";
import { EditBookSheet } from "@/components/books/edit-book-sheet";
import { UpdateProgressSheet } from "@/components/books/update-progress-sheet";
import { BookTagBadge } from "@/components/books/book-tag-badge";
import { RatingStars } from "@/components/books/rating-stars";
import { ProgressBar } from "@/components/books/progress-bar";
import type { ProgressValue } from "@/components/books/progress-input";
import { hasProgress } from "@/lib/book-progress";
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
  layout = "list",
}: {
  userBook: UserBook;
  showRating?: boolean;
  coverSize?: "sm" | "lg";
  layout?: "list" | "grid";
}) {
  const router = useRouter();
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isSavingProgress, startSavingProgress] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [progressError, setProgressError] = useState<string | null>(null);

  function handleSave(
    status: BookStatus,
    tags: BookTag[],
    rating?: number,
    note?: string,
    progress?: ProgressValue,
  ) {
    setError(null);
    startSaving(async () => {
      try {
        await updateUserBook(userBook.id, {
          status,
          tags,
          rating,
          note,
          progressType: progress?.progressType ?? undefined,
          progressCurrent: progress?.progressCurrent ?? undefined,
          progressTotalPages: progress?.progressTotalPages ?? undefined,
        });
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

  // Acceso rápido de la card (sin abrir `EditBookSheet` completo): reusa la
  // misma acción que la edición completa, sin tocar status/tags/rating/note,
  // para no duplicar la lógica sensible al constraint `progress_bounds`.
  function handleSaveProgress(progress: ProgressValue) {
    setProgressError(null);
    startSavingProgress(async () => {
      try {
        await updateUserBook(userBook.id, {
          status: userBook.status,
          tags: userBook.tags,
          rating: userBook.rating ?? undefined,
          note: userBook.note ?? undefined,
          progressType: progress.progressType ?? undefined,
          progressCurrent: progress.progressCurrent ?? undefined,
          progressTotalPages: progress.progressTotalPages ?? undefined,
        });
        setProgressOpen(false);
      } catch {
        setProgressError("No pudimos actualizar el progreso. Probá de nuevo.");
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
        layout={layout}
        onClick={() => {
          // Libros de Google Books tienen página propia con descripción,
          // género y rating de Google; los cargados a mano no tienen nada
          // de eso que buscar, así que siguen abriendo el sheet de siempre.
          if (userBook.book.googleBooksId) {
            router.push(`/libro/${userBook.book.googleBooksId}`);
          } else {
            setDetailOpen(true);
          }
        }}
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
        footer={
          userBook.status === "reading" ? (
            hasProgress(userBook) ? (
              // Una vez cargado el progreso, la card ya no ofrece el acceso
              // rápido: se edita desde ahí en adelante vía "⋯" (EditBookSheet),
              // el botón era solo el nudge inicial para cargarlo por primera vez.
              <ProgressBar
                progressType={userBook.progressType}
                progressCurrent={userBook.progressCurrent}
                progressTotalPages={userBook.progressTotalPages}
              />
            ) : (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setProgressOpen(true);
                }}
                className="self-start text-xs font-semibold text-ink-muted underline-offset-2 hover:underline"
              >
                Agregar progreso
              </button>
            )
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
        progressType={userBook.progressType}
        progressCurrent={userBook.progressCurrent}
        progressTotalPages={userBook.progressTotalPages}
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
        bookPageCount={userBook.book.pageCount}
        currentStatus={userBook.status}
        currentTags={userBook.tags}
        currentRating={userBook.rating}
        currentNote={userBook.note}
        currentProgressType={userBook.progressType}
        currentProgressCurrent={userBook.progressCurrent}
        currentProgressTotalPages={userBook.progressTotalPages}
        onSave={handleSave}
        onDelete={handleDelete}
        isSaving={isSaving}
        isDeleting={isDeleting}
        error={error}
      />

      <UpdateProgressSheet
        open={progressOpen}
        onOpenChange={(next) => {
          setProgressOpen(next);
          if (!next) setProgressError(null);
        }}
        bookTitle={userBook.book.title}
        bookPageCount={userBook.book.pageCount}
        currentProgress={{
          progressType: userBook.progressType,
          progressCurrent: userBook.progressCurrent,
          progressTotalPages: userBook.progressTotalPages,
        }}
        onSave={handleSaveProgress}
        isSaving={isSavingProgress}
        error={progressError}
      />
    </>
  );
}
