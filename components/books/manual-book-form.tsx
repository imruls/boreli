"use client";

import { useState, type FormEvent } from "react";
import { Sheet, SheetBody, SheetContent, SheetNavBar } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ListItem, ListSection } from "@/components/ui/list";
import { isHttpUrl, normalizeHttpUrl } from "@/lib/utils";
import {
  BOOK_AUTHOR_MAX_LENGTH,
  BOOK_COVER_URL_MAX_LENGTH,
  BOOK_PAGE_COUNT_MAX,
  BOOK_TITLE_MAX_LENGTH,
} from "@/lib/book-validation";
import type { Book } from "@/types/book";

// Campo dentro de una fila de lista agrupada: la fila ya es el fondo.
const FIELD_CLASS = "rounded-none bg-transparent px-0 focus-visible:ring-0";

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
      <SheetContent>
        <SheetNavBar
          title="Cargar libro"
          leading={
            <Button variant="ghost" className="font-normal" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          }
          trailing={
            <Button variant="ghost" type="submit" form="manual-book-form">
              Continuar
            </Button>
          }
        />
        <SheetBody>
          {/* Formulario agrupado de iOS: cada campo es una fila, sin label
              visible; el placeholder y el aria-label nombran el campo. */}
          <form id="manual-book-form" onSubmit={handleSubmit} className="flex flex-col gap-6">
            <ListSection
              footer={
                error ? (
                  <span className="text-destructive">{error}</span>
                ) : (
                  "Para cuando no lo encontrás en la búsqueda. Título y autor son obligatorios."
                )
              }
            >
              <ListItem className="py-0">
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={BOOK_TITLE_MAX_LENGTH}
                  placeholder="Título"
                  aria-label="Título"
                  className={FIELD_CLASS}
                />
              </ListItem>
              <ListItem className="py-0">
                <Input
                  value={authors}
                  onChange={(event) => setAuthors(event.target.value)}
                  maxLength={BOOK_AUTHOR_MAX_LENGTH}
                  placeholder="Autor/es (separados por coma)"
                  aria-label="Autor/es"
                  className={FIELD_CLASS}
                />
              </ListItem>
            </ListSection>

            <ListSection header="Opcional">
              <ListItem className="py-0">
                <Input
                  type="url"
                  value={coverUrl}
                  onChange={(event) => setCoverUrl(event.target.value)}
                  onBlur={(event) => setCoverUrl(normalizeHttpUrl(event.target.value))}
                  maxLength={BOOK_COVER_URL_MAX_LENGTH}
                  placeholder="URL de la portada"
                  aria-label="URL de la portada"
                  className={FIELD_CLASS}
                />
              </ListItem>
              <ListItem className="py-0">
                <Input
                  type="number"
                  min={1}
                  max={BOOK_PAGE_COUNT_MAX}
                  inputMode="numeric"
                  value={pageCount}
                  onChange={(event) => setPageCount(event.target.value)}
                  placeholder="Cantidad de páginas"
                  aria-label="Cantidad de páginas"
                  className={FIELD_CLASS}
                />
              </ListItem>
            </ListSection>
          </form>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
