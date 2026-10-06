"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Sheet, SheetBody, SheetContent, SheetNavBar } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ListRow, ListSection } from "@/components/ui/list";
import { SearchField } from "@/components/ui/search-field";
import { Spinner } from "@/components/ui/spinner";
import { BookCard, BookList } from "@/components/books/book-card";
import type { ImportRow } from "@/lib/csv-import";
import type { Book } from "@/types/book";

export type ImportChoice = { kind: "google"; book: Book } | { kind: "manual" };

const DEBOUNCE_MS = 400;

type SearchState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; books: Book[] }
  | { status: "error"; message: string };

// Corrección de una fila de la importación: elegir otra de las coincidencias
// de Google Books (otra edición, el libro correcto), buscarlo a mano si el
// emparejado automático no lo encontró, o cargarla como manual.
// El padre debe pasar una `key` distinta por fila para reiniciar la búsqueda.
export function ImportMatchSheet({
  open,
  onOpenChange,
  row,
  candidates,
  choice,
  onChoose,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ImportRow | null;
  candidates: Book[];
  choice: ImportChoice;
  onChoose: (choice: ImportChoice) => void;
}) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState<SearchState>({ status: "idle" });
  const latestRequestRef = useRef(0);
  const selectedId = choice.kind === "google" ? choice.book.id : null;
  const trimmedQuery = query.trim();

  // Mismo proxy a Google Books (y mismo rate limit) que la pantalla Buscar.
  useEffect(() => {
    if (!trimmedQuery) return;

    const requestId = ++latestRequestRef.current;
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setSearch({ status: "loading" });
      try {
        const response = await fetch(`/api/books/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        const data = (await response.json().catch(() => ({}))) as { books?: Book[]; error?: string };
        if (latestRequestRef.current !== requestId) return;
        if (!response.ok) {
          setSearch({ status: "error", message: data.error ?? "No pudimos buscar. Probá de nuevo." });
          return;
        }
        setSearch({ status: "done", books: data.books ?? [] });
      } catch {
        if (controller.signal.aborted || latestRequestRef.current !== requestId) return;
        setSearch({ status: "error", message: "No pudimos buscar. Revisá tu conexión." });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [trimmedQuery]);

  const isSearching = trimmedQuery !== "";
  const books = isSearching ? (search.status === "done" ? search.books : []) : candidates;

  function renderBooks(list: Book[]) {
    return (
      <BookList>
        {list.map((book) => (
          <BookCard
            key={book.id}
            title={book.title}
            authors={book.authors}
            coverUrl={book.coverUrl}
            trustedCover
            meta={
              book.publishedDate || book.pageCount ? (
                <p className="text-footnote text-label-secondary">
                  {[book.publishedDate?.slice(0, 4), book.pageCount ? `${book.pageCount} páginas` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : undefined
            }
            action={
              book.id === selectedId ? (
                <Check className="mr-2 size-5 text-tint" strokeWidth={2.5} aria-label="Elegido" />
              ) : undefined
            }
            onClick={() => onChoose({ kind: "google", book })}
          />
        ))}
      </BookList>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetNavBar
          title="Elegir libro"
          leading={
            <Button variant="ghost" className="font-normal" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
          }
        />
        <SheetBody>
          {row ? (
            <p className="text-center text-subheadline text-label-secondary">
              En tu archivo: {row.title}
              {row.authors.length > 0 ? ` — ${row.authors.join(", ")}` : ""}
            </p>
          ) : null}

          <SearchField
            value={query}
            onValueChange={setQuery}
            placeholder="Buscar en Google Books"
          />

          <section className="flex flex-col gap-1.5">
            <h2 className="px-4 text-footnote text-label-secondary">
              {isSearching ? "Resultados" : "Coincidencias"}
            </h2>
            {isSearching && search.status === "loading" ? (
              <div className="flex justify-center py-6">
                <Spinner />
              </div>
            ) : isSearching && search.status === "error" ? (
              <p className="px-4 text-subheadline text-destructive">{search.message}</p>
            ) : books.length > 0 ? (
              renderBooks(books)
            ) : (
              <p className="px-4 text-subheadline text-label-secondary">
                {isSearching
                  ? "Sin resultados. Probá con otro título o con el nombre del autor."
                  : "No encontramos coincidencias. Buscalo arriba con otro título o autor."}
              </p>
            )}
          </section>

          <ListSection footer="Se guarda solo con el título y el autor del archivo, sin portada.">
            <ListRow
              label="Cargar sin Google Books"
              selected={choice.kind === "manual"}
              onClick={() => onChoose({ kind: "manual" })}
            />
          </ListSection>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
