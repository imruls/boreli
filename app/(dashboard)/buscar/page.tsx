"use client";

import { useState, useTransition } from "react";
import { Search as SearchIcon, X, Plus } from "lucide-react";
import { PageHeader } from "@/components/nav/page-header";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BookCard } from "@/components/books/book-card";
import { BookListSkeleton } from "@/components/books/book-list-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AddToLibrarySheet } from "@/components/books/add-to-library-sheet";
import { MOCK_SEARCH_BOOKS } from "@/lib/mock/search-books";
import type { Book, BookStatus } from "@/types/book";

const CATEGORIES = ["Todos", "Libros", "Autores", "Editoriales"];

function filterMockBooks(query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return MOCK_SEARCH_BOOKS;
  return MOCK_SEARCH_BOOKS.filter(
    (book) =>
      book.title.toLowerCase().includes(normalized) ||
      book.authors.some((author) => author.toLowerCase().includes(normalized)),
  );
}

export default function BuscarPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todos");
  const [results, setResults] = useState<Book[]>(MOCK_SEARCH_BOOKS);
  const [isPending, startTransition] = useTransition();
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  // Simula latencia de red para poder mostrar el estado "Cargando (skeleton)"
  // del mockup — no hay una API real todavía (Semana 2 del ROADMAP).
  function handleQueryChange(value: string) {
    setQuery(value);
    startTransition(async () => {
      await new Promise((resolve) => setTimeout(resolve, 450));
      setResults(filterMockBooks(value));
    });
  }

  function handleClearSearch() {
    setQuery("");
    setResults(MOCK_SEARCH_BOOKS);
  }

  function handleAddToLibrary(status: BookStatus) {
    // La persistencia real (upsert en `books` + insert en `user_books`) es
    // trabajo de la Semana 2 del ROADMAP — por ahora esta pantalla es solo
    // la referencia visual del flujo de búsqueda + alta.
    void status;
    setSelectedBook(null);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 pb-24 md:pb-8">
      <PageHeader title="Buscar" showBack={false} />

      <div className="flex flex-col gap-3 px-4 sm:px-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={query}
            onChange={(event) => handleQueryChange(event.target.value)}
            placeholder="Buscar libros, autores…"
            className="h-11 rounded-xl pl-9 pr-9"
          />
          {query ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Limpiar búsqueda"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        <ToggleGroup
          type="single"
          value={category}
          onValueChange={(value) => value && setCategory(value)}
          className="flex-nowrap gap-2 overflow-x-auto pb-1"
        >
          {CATEGORIES.map((label) => (
            <ToggleGroupItem
              key={label}
              value={label}
              className="rounded-full border border-ink-border px-3.5 text-xs font-semibold text-ink-muted data-[state=on]:border-ink data-[state=on]:bg-ink data-[state=on]:text-cream"
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex-1 px-4 sm:px-6">
        {isPending ? (
          <BookListSkeleton rows={3} />
        ) : results.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title="No encontramos resultados"
            description="Probá con otras palabras clave o cargalo a mano."
            action={{ label: "Limpiar búsqueda", onClick: handleClearSearch }}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {results.map((book) => (
              <BookCard
                key={book.id}
                title={book.title}
                authors={book.authors}
                coverUrl={book.coverUrl}
                action={
                  <button
                    type="button"
                    onClick={() => setSelectedBook(book)}
                    aria-label={`Agregar ${book.title}`}
                    className="flex size-8 items-center justify-center rounded-full bg-ink text-cream"
                  >
                    <Plus className="size-4" />
                  </button>
                }
              />
            ))}
          </div>
        )}
      </div>

      <AddToLibrarySheet
        open={selectedBook !== null}
        onOpenChange={(open) => !open && setSelectedBook(null)}
        bookTitle={selectedBook?.title}
        onSelect={handleAddToLibrary}
      />
    </div>
  );
}
