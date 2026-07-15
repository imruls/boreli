"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search as SearchIcon, X, Plus, WifiOff, Check } from "lucide-react";
import { PageHeader } from "@/components/nav/page-header";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { BookCard } from "@/components/books/book-card";
import { BookListSkeleton } from "@/components/books/book-list-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AddToLibrarySheet } from "@/components/books/add-to-library-sheet";
import { ManualBookForm } from "@/components/books/manual-book-form";
import { addBookToLibrary } from "@/app/(dashboard)/buscar/actions";
import type { Book, BookStatus, BookTag } from "@/types/book";

const CATEGORIES = ["Todos", "Libros", "Autores", "Editoriales"];
const DEBOUNCE_MS = 400;
const CONFIRMATION_MS = 2500;

const STATUS_CONFIRMATION: Record<BookStatus, string> = {
  want_to_read: "Agregado a Quiero leer",
  reading: "Agregado a Leyendo",
  read: "Agregado a Leídos",
};

type SearchStatus = "idle" | "loading" | "error";

export default function BuscarPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Todos");
  const [results, setResults] = useState<Book[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [retryToken, setRetryToken] = useState(0);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const latestRequestRef = useRef(0);
  const confirmationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce del input real contra `app/api/books/search/route.ts` (proxy a
  // Google Books). `latestRequestRef` descarta respuestas de búsquedas viejas
  // que llegan fuera de orden.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      // Nada para buscar: la UI ya prioriza el estado "sin búsqueda" en base
      // a `trimmedQuery` en el render, sin depender de `results`/`searchStatus`.
      return;
    }

    const requestId = ++latestRequestRef.current;

    const timeoutId = setTimeout(async () => {
      setSearchStatus("loading");
      try {
        const response = await fetch(`/api/books/search?q=${encodeURIComponent(trimmed)}`);
        if (!response.ok) throw new Error("Search request failed");
        const data = (await response.json()) as { books: Book[] };
        if (latestRequestRef.current !== requestId) return;
        setResults(data.books);
        setSearchStatus("idle");
      } catch {
        if (latestRequestRef.current !== requestId) return;
        setResults([]);
        setSearchStatus("error");
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query, retryToken]);

  useEffect(() => {
    return () => {
      if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);
    };
  }, []);

  function handleClearSearch() {
    setQuery("");
    setResults([]);
    setSearchStatus("idle");
  }

  function handleRetry() {
    setRetryToken((token) => token + 1);
  }

  function handleAddToLibrary(status: BookStatus, tags: BookTag[], rating?: number, note?: string) {
    const book = selectedBook;
    if (!book) return;

    setSaveError(null);
    startSaving(async () => {
      try {
        await addBookToLibrary(book, status, tags, rating, note);
        setSelectedBook(null);
        showConfirmation(STATUS_CONFIRMATION[status]);
      } catch {
        setSaveError("No pudimos agregar el libro. Probá de nuevo.");
      }
    });
  }

  function handleManualSubmit(book: Book) {
    setIsManualFormOpen(false);
    setSelectedBook(book);
  }

  function showConfirmation(message: string) {
    setConfirmation(message);
    if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);
    confirmationTimeoutRef.current = setTimeout(() => setConfirmation(null), CONFIRMATION_MS);
  }

  const trimmedQuery = query.trim();
  const isLoading = searchStatus === "loading";
  const isError = searchStatus === "error";

  return (
    <div className="flex flex-1 flex-col gap-4 pb-24 md:pb-8">
      <PageHeader title="Buscar" showBack={false} />

      {confirmation ? (
        <div className="mx-4 flex items-center gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-sm text-cream sm:mx-6">
          <Check className="size-4 shrink-0" />
          {confirmation}
        </div>
      ) : null}

      {saveError ? (
        <div className="mx-4 flex items-center justify-between gap-2 rounded-xl border border-ink-border px-3.5 py-2.5 text-sm text-ink sm:mx-6">
          {saveError}
          <button
            type="button"
            onClick={() => setSaveError(null)}
            aria-label="Cerrar aviso"
            className="shrink-0 text-ink-muted"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 px-4 sm:px-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
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

        <button
          type="button"
          onClick={() => setIsManualFormOpen(true)}
          className="self-start text-xs font-medium text-ink-muted underline underline-offset-4"
        >
          ¿No lo encontrás? Cargalo a mano
        </button>

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
        {!trimmedQuery ? (
          <EmptyState
            icon={SearchIcon}
            title="Buscá tu próximo libro"
            description="Escribí un título o autor para ver resultados de Google Books."
          />
        ) : isLoading ? (
          <BookListSkeleton rows={3} />
        ) : isError ? (
          <EmptyState
            icon={WifiOff}
            title="No pudimos buscar"
            description="Hubo un problema al conectar con Google Books. Probá de nuevo."
            action={{ label: "Reintentar", onClick: handleRetry }}
          />
        ) : results.length === 0 ? (
          <EmptyState
            icon={SearchIcon}
            title="No encontramos resultados"
            description="Probá con otras palabras clave o cargalo a mano."
            action={{ label: "Cargar a mano", onClick: () => setIsManualFormOpen(true) }}
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {results.map((book) => (
              <BookCard
                key={book.id}
                title={book.title}
                authors={book.authors}
                coverUrl={book.coverUrl}
                trustedCover={Boolean(book.googleBooksId)}
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

      <ManualBookForm
        open={isManualFormOpen}
        onOpenChange={setIsManualFormOpen}
        onSubmit={handleManualSubmit}
      />

      <AddToLibrarySheet
        key={selectedBook?.id ?? "none"}
        open={selectedBook !== null}
        onOpenChange={(open) => !open && setSelectedBook(null)}
        bookTitle={selectedBook?.title}
        onSelect={handleAddToLibrary}
        isSaving={isSaving}
      />
    </div>
  );
}
