"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BookOpen } from "lucide-react";
import { PageHeader } from "@/components/nav/page-header";
import { Button } from "@/components/ui/button";
import { ListItem, ListRow, ListSection } from "@/components/ui/list";
import { COVER_FRAME_CLASS } from "@/components/books/book-card";
import { BookStatusBadge } from "@/components/books/book-status-badge";
import { BookTagBadge } from "@/components/books/book-tag-badge";
import { RatingStars } from "@/components/books/rating-stars";
import { ProgressBar } from "@/components/books/progress-bar";
import { EditBookSheet } from "@/components/books/edit-book-sheet";
import { AddToLibrarySheet } from "@/components/books/add-to-library-sheet";
import type { ProgressValue } from "@/components/books/progress-input";
import { hasProgress } from "@/lib/book-progress";
import { cn, stripHtml } from "@/lib/utils";
import { updateUserBook, deleteUserBook } from "@/app/(dashboard)/actions";
import { addBookToLibrary } from "@/app/(dashboard)/buscar/actions";
import type { BookStatus, BookTag, GoogleBookDetail, UserBook } from "@/types/book";

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

  const googleRating = detail.averageRating
    ? `${detail.averageRating.toFixed(1)}/5${detail.ratingsCount ? ` (${detail.ratingsCount})` : ""}`
    : null;

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader
        title="Libro"
        back="history"
        actions={
          userBook ? (
            <Button variant="ghost" onClick={() => setEditOpen(true)}>
              Editar
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-8 px-(--layout-margin)">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className={cn(COVER_FRAME_CLASS, "h-48 w-32 shadow-[0_8px_24px_rgb(0_0_0/18%)]")}>
            {detail.coverUrl ? (
              <Image
                src={detail.coverUrl}
                alt={detail.title}
                width={256}
                height={384}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-label-tertiary">
                <BookOpen className="size-8" aria-hidden />
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-1">
            <h2 className="text-title-2 text-label">{detail.title}</h2>
            {detail.authors.length > 0 ? (
              <p className="text-subheadline text-label-secondary">{detail.authors.join(", ")}</p>
            ) : null}
            {userBook ? <BookStatusBadge status={userBook.status} className="mt-2" /> : null}
          </div>
          {!userBook ? (
            <div className="flex w-full flex-col gap-2">
              <Button size="lg" className="w-full" onClick={() => setAddOpen(true)}>
                Agregar a biblioteca
              </Button>
              {addError ? <p className="text-footnote text-destructive">{addError}</p> : null}
            </div>
          ) : null}
        </div>

        {userBook ? (
          <ListSection header="En tu biblioteca">
            <ListItem>
              {userBook.tags.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {userBook.tags.map((tag) => (
                    <BookTagBadge key={tag} tag={tag} />
                  ))}
                </div>
              ) : (
                <p className="text-body text-label-secondary">Sin etiquetas</p>
              )}
            </ListItem>
            {userBook.status === "reading" && hasProgress(userBook) ? (
              <ListItem>
                <ProgressBar
                  progressType={userBook.progressType}
                  progressCurrent={userBook.progressCurrent}
                  progressTotalPages={userBook.progressTotalPages}
                />
              </ListItem>
            ) : null}
            {userBook.status === "read" ? (
              <ListItem className="flex flex-col gap-2">
                {userBook.rating ? (
                  <RatingStars rating={userBook.rating} className="gap-1 [&_svg]:size-5" />
                ) : (
                  <p className="text-body text-label-secondary">Sin calificación</p>
                )}
                {userBook.note ? (
                  <p className="text-body whitespace-pre-wrap text-label">{userBook.note}</p>
                ) : null}
              </ListItem>
            ) : null}
          </ListSection>
        ) : null}

        <ListSection header="Información">
          <MetaRow label="Publicación" value={detail.publishedDate} />
          <MetaRow label="Género" value={genre} />
          <MetaRow label="Páginas" value={detail.pageCount ? String(detail.pageCount) : null} />
          <MetaRow label="Rating de Google" value={googleRating} />
        </ListSection>

        {detail.description ? (
          <section className="flex flex-col gap-2">
            <h2 className="text-title-3 text-label">Descripción</h2>
            <p className="text-body whitespace-pre-wrap text-label">
              {stripHtml(detail.description)}
            </p>
          </section>
        ) : null}
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

function MetaRow({ label, value }: { label: string; value: string | null }) {
  return <ListRow label={label} detail={value ?? "No disponible"} />;
}
