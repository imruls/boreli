"use client";

import { useState, type FormEvent } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isHttpUrl, normalizeHttpUrl } from "@/lib/utils";
import {
  BOOK_AUTHOR_MAX_LENGTH,
  BOOK_COVER_URL_MAX_LENGTH,
  BOOK_PAGE_COUNT_MAX,
  BOOK_TITLE_MAX_LENGTH,
} from "@/lib/book-validation";
import type { Book } from "@/types/book";

// Carga manual para cuando la búsqueda en Google Books no encuentra el
// libro (ver tabla de campos en data-model.md): título y autor obligatorios,
// portada y páginas opcionales. `description`/`publishedDate`/`googleBooksId`
// quedan en null a propósito, no se piden en este formulario.
export function ManualBookForm({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (book: Book) => void;
}) {
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const authorList = authors
      .split(",")
      .map((author) => author.trim())
      .filter(Boolean);

    if (!trimmedTitle || authorList.length === 0) {
      setError("Título y autor son obligatorios.");
      return;
    }

    // `normalizeHttpUrl` solo antepone "https://" cuando falta el protocolo
    // (typo común); si ya trae un esquema (incluido uno peligroso) lo deja
    // igual para que `isHttpUrl` lo rechace, no para que se cuele como host.
    const normalizedCoverUrl = normalizeHttpUrl(coverUrl);
    if (normalizedCoverUrl && !isHttpUrl(normalizedCoverUrl)) {
      setError("La URL de la portada tiene que empezar con http:// o https://.");
      return;
    }

    const parsedPageCount = pageCount.trim() ? Number(pageCount) : null;

    onSubmit({
      id: crypto.randomUUID(),
      googleBooksId: null,
      title: trimmedTitle,
      authors: authorList,
      coverUrl: normalizedCoverUrl || null,
      pageCount: parsedPageCount && parsedPageCount > 0 ? parsedPageCount : null,
      description: null,
      publishedDate: null,
    });

    setTitle("");
    setAuthors("");
    setCoverUrl("");
    setPageCount("");
    setError(null);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <SheetContent side="bottom" className="rounded-t-2xl border-ink-border">
        <SheetHeader>
          <SheetTitle className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            Cargar libro a mano
          </SheetTitle>
          <p className="text-sm text-ink-muted">Para cuando no lo encontrás en la búsqueda.</p>
        </SheetHeader>

        <form id="manual-book-form" onSubmit={handleSubmit} className="flex flex-col gap-4 px-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-title">Título</Label>
            <Input
              id="manual-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={BOOK_TITLE_MAX_LENGTH}
              placeholder="Título del libro"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-authors">Autor/es</Label>
            <Input
              id="manual-authors"
              value={authors}
              onChange={(event) => setAuthors(event.target.value)}
              maxLength={BOOK_AUTHOR_MAX_LENGTH}
              placeholder="Separá con coma si son varios"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-cover">Portada (URL, opcional)</Label>
            <Input
              id="manual-cover"
              type="url"
              value={coverUrl}
              onChange={(event) => setCoverUrl(event.target.value)}
              onBlur={(event) => setCoverUrl(normalizeHttpUrl(event.target.value))}
              maxLength={BOOK_COVER_URL_MAX_LENGTH}
              placeholder="https://…"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manual-pages">Páginas (opcional)</Label>
            <Input
              id="manual-pages"
              type="number"
              min={1}
              max={BOOK_PAGE_COUNT_MAX}
              inputMode="numeric"
              value={pageCount}
              onChange={(event) => setPageCount(event.target.value)}
              placeholder="Cantidad de páginas"
            />
          </div>

          {error ? <p className="text-sm text-ink-muted">{error}</p> : null}
        </form>

        <SheetFooter>
          <Button type="submit" form="manual-book-form">
            Continuar
          </Button>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
