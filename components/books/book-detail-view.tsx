"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { BackButton } from "@/components/nav/back-button";
import { Button } from "@/components/ui/button";
import { BookTagBadge } from "@/components/books/book-tag-badge";
import { RatingStars } from "@/components/books/rating-stars";
import { ProgressBar } from "@/components/books/progress-bar";
import { EditBookSheet } from "@/components/books/edit-book-sheet";
import { AddToLibrarySheet } from "@/components/books/add-to-library-sheet";
import type { ProgressValue } from "@/components/books/progress-input";
import { hasProgress } from "@/lib/book-progress";
import { stripHtml } from "@/lib/utils";
import { updateUserBook, deleteUserBook } from "@/app/(dashboard)/actions";
import { addBookToLibrary } from "@/app/(dashboard)/buscar/actions";
import type { BookStatus, BookTag, GoogleBookDetail, UserBook } from "@/types/book";

const STATUS_LABEL: Record<BookStatus, string> = {
  want_to_read: "Quiero leer",
  reading: "Leyendo",
  read: "Leído",
};

// Página completa de detalle (`/libro/[id]`): combina el detalle on-demand
// de Google Books (`detail`, siempre presente) con la relación del usuario
// con el libro si ya está en su biblioteca (`userBook`, o null). Reusa
// `EditBookSheet`/`AddToLibrarySheet` tal cual (mismas server actions que
// `UserBookCard`/`buscar/page.tsx`) y pide `router.refresh()` tras guardar
// para que el server component padre vuelva a resolver `userBook`.
export function BookDetailView({
  detail,
  userBook,
}: {
  detail: GoogleBookDetail;
  userBook: UserBook | null;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isAdding, startAdding] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  function handleSave(
    status: BookStatus,
    tags: BookTag[],
    rating?: number,
    note?: string,
    progress?: ProgressValue,
  ) {
    if (!userBook) return;
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
        router.refresh();
      } catch {
        setError("No pudimos actualizar el libro. Probá de nuevo.");
      }
    });
  }

  function handleDelete() {
    if (!userBook) return;
    setError(null);
    startDeleting(async () => {
      try {
        await deleteUserBook(userBook.id);
        setEditOpen(false);
        router.refresh();
      } catch {
        setError("No pudimos eliminar el libro. Probá de nuevo.");
      }
    });
  }

  function handleAdd(status: BookStatus, tags: BookTag[], rating?: number, note?: string) {
    setAddError(null);
    startAdding(async () => {
      try {
        await addBookToLibrary(
          {
            id: detail.googleBooksId,
            googleBooksId: detail.googleBooksId,
            title: detail.title,
            authors: detail.authors,
            coverUrl: detail.coverUrl,
            pageCount: detail.pageCount,
            description: detail.description,
            publishedDate: detail.publishedDate,
          },
          status,
          tags,
          rating,
          note,
        );
        setAddOpen(false);
        router.refresh();
      } catch {
        setAddError("No pudimos agregar el libro. Probá de nuevo.");
      }
    });
  }

  const genre = detail.categories.length > 0 ? detail.categories.join(", ") : null;

  return (
    <div className="flex flex-1 flex-col gap-6 pb-24 md:pb-8">
      <div className="flex items-center gap-3 px-4 pt-4 sm:px-6">
        <BackButton />
        <h1 className="font-heading text-lg font-bold text-ink">Libro</h1>
      </div>

      <div className="flex flex-col gap-6 px-4 sm:px-6">
        <div className="flex gap-4">
          <div className="h-40 w-28 shrink-0 overflow-hidden rounded-lg bg-ink-border">
            {detail.coverUrl ? (
              <Image
                src={detail.coverUrl}
                alt={detail.title}
                width={168}
                height={240}
                className="size-full object-contain"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-ink-muted">
                <BookOpen className="size-8" />
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1 pt-1">
            <h2 className="font-heading text-xl font-bold text-ink">{detail.title}</h2>
            {detail.authors.length > 0 ? (
              <p className="text-sm text-ink-muted">{detail.authors.join(", ")}</p>
            ) : null}
            {userBook ? (
              <span className="mt-1 text-xs font-semibold text-ink-muted">
                {STATUS_LABEL[userBook.status]}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 rounded-xl border border-ink-border p-4">
          <MetaField label="Fecha de publicación" value={detail.publishedDate} />
          <MetaField label="Género" value={genre} />
          <MetaField label="Páginas" value={detail.pageCount ? String(detail.pageCount) : null} />
          <MetaField
            label="Rating de Google"
            value={
              detail.averageRating
                ? `${detail.averageRating.toFixed(1)}/5${
                    detail.ratingsCount ? ` (${detail.ratingsCount})` : ""
                  }`
                : null
            }
          />
        </div>

        {detail.description ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-ink-muted">Descripción</span>
            <p className="text-sm whitespace-pre-wrap text-ink">
              {stripHtml(detail.description)}
            </p>
          </div>
        ) : null}

        {userBook ? (
          <div className="flex flex-col gap-4 rounded-xl border border-ink-border p-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-ink-muted">Etiquetas</span>
              {userBook.tags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {userBook.tags.map((tag) => (
                    <BookTagBadge key={tag} tag={tag} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink-muted">Sin etiquetas</p>
              )}
            </div>

            {userBook.status === "reading" && hasProgress(userBook) ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">Progreso</span>
                <ProgressBar
                  progressType={userBook.progressType}
                  progressCurrent={userBook.progressCurrent}
                  progressTotalPages={userBook.progressTotalPages}
                />
              </div>
            ) : null}

            {userBook.status === "read" ? (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-ink-muted">Calificación</span>
                {userBook.rating ? (
                  <RatingStars rating={userBook.rating} className="gap-1" />
                ) : (
                  <p className="text-sm text-ink-muted">Sin calificación</p>
                )}
                {userBook.note ? (
                  <p className="mt-1 text-sm whitespace-pre-wrap text-ink">{userBook.note}</p>
                ) : null}
              </div>
            ) : null}

            <Button onClick={() => setEditOpen(true)} className="self-start">
              Editar
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button onClick={() => setAddOpen(true)} className="self-start">
              Agregar a biblioteca
            </Button>
            {addError ? <p className="text-sm text-destructive">{addError}</p> : null}
          </div>
        )}
      </div>

      {userBook ? (
        <EditBookSheet
          key={userBook.id}
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
      ) : (
        <AddToLibrarySheet
          open={addOpen}
          onOpenChange={(next) => {
            setAddOpen(next);
            if (!next) setAddError(null);
          }}
          bookTitle={detail.title}
          onSelect={handleAdd}
          isSaving={isAdding}
        />
      )}
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
      <span className="text-sm text-ink">{value ?? "No disponible"}</span>
    </div>
  );
}
