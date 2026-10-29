"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, Plus, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/nav/page-header";
import { Button } from "@/components/ui/button";
import { SearchField } from "@/components/ui/search-field";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { BookCard, BookList } from "@/components/books/book-card";
import { BookListSkeleton } from "@/components/books/book-list-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { AddToLibrarySheet } from "@/components/books/add-to-library-sheet";
import { ManualBookForm } from "@/components/books/manual-book-form";
import { ConfirmationBanner, useConfirmationBanner } from "@/components/ui/confirmation-banner";
import { addBookToLibrary } from "@/app/(dashboard)/buscar/actions";
import type { BookSearchField } from "@/lib/google-books";
import type { Book, BookStatus, BookTag } from "@/types/book";

// Sin "Editoriales": Google Books indexa el campo de editorial de forma muy
// inconsistente (`inpublisher:`), así que ese filtro suele devolver poco o
// nada incluso para editoriales conocidas — mejor no ofrecerlo que ofrecer
// uno que decepciona.
const CATEGORIES: { label: string; value: BookSearchField }[] = [
  { label: "Todos", value: "all" },
  { label: "Libros", value: "title" },
  { label: "Autores", value: "author" },
];
const DEBOUNCE_MS = 400;
// Si el servidor no responde, se corta la request y se muestra el estado de
// error con "Reintentar" en vez de dejar el skeleton cargando para siempre.
const SEARCH_TIMEOUT_MS = 20_000;

const STATUS_CONFIRMATION: Record<BookStatus, string> = {
  want_to_read: "Agregado a Quiero leer",
  reading: "Agregado a Leyendo",
  read: "Agregado a Leídos",
};

type SearchStatus = "idle" | "loading" | "error";

export default function BuscarPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BookSearchField>("all");
  const [results, setResults] = useState<Book[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>("idle");
  const [retryToken, setRetryToken] = useState(0);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isManualFormOpen, setIsManualFormOpen] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);
  const { message: confirmation, show: showConfirmation } = useConfirmationBanner();
  const latestRequestRef = useRef(0);

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
    const controller = new AbortController();

    let requestTimeoutId: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;

    const timeoutId = setTimeout(async () => {
      setSearchStatus("loading");
      requestTimeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, SEARCH_TIMEOUT_MS);
      try {
        const response = await fetch(
          `/api/books/search?q=${encodeURIComponent(trimmed)}&field=${category}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Search request failed");
        const data = (await response.json()) as { books: Book[] };
        if (latestRequestRef.current !== requestId) return;
        setResults(data.books);
        setSearchStatus("idle");
      } catch {
        // Abortada por el cleanup (cambió la búsqueda): la request nueva se
        // encarga del estado. Abortada por timeout: sí es un error.
        if (controller.signal.aborted && !timedOut) return;
        if (latestRequestRef.current !== requestId) return;
        setResults([]);
        setSearchStatus("error");
      } finally {
        clearTimeout(requestTimeoutId);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(requestTimeoutId);
      controller.abort();
    };
  }, [query, category, retryToken]);

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

  const trimmedQuery = query.trim();
  const isLoading = searchStatus === "loading";
  const isError = searchStatus === "error";

  return (
    <div className="flex flex-1 flex-col gap-4">
      <PageHeader title="Buscar" />

      <ConfirmationBanner message={confirmation} />

      <div className="flex flex-col gap-3 px-(--layout-margin)">
        <SearchField
          value={query}
          onValueChange={(next) => (next ? setQuery(next) : handleClearSearch())}
          placeholder="Buscar libros, autores"
        />

        <SegmentedControl
          aria-label="Buscar en"
          value={category}
          onValueChange={setCategory}
          options={CATEGORIES}
        />

        {saveError ? (
          <p role="alert" className="text-footnote text-destructive">
            {saveError}
          </p>
        ) : null}
      </div>

      <div className="flex-1 px-(--layout-margin)">
        {!trimmedQuery ? (
          <div className="flex flex-col">
            <EmptyState
              icon={SearchIcon}
              title="Buscá tu próximo libro"
              description="Escribí un título o autor para ver resultados de Google Books."
            />
            <ManualEntryLink onClick={() => setIsManualFormOpen(true)} />
          </div>
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
          <div className="flex flex-col gap-3">
          <BookList>
            {results.map((book) => (
              <BookCard
                key={book.id}
                title={book.title}
                authors={book.authors}
                coverUrl={book.coverUrl}
                trustedCover={Boolean(book.googleBooksId)}
                onClick={
                  book.googleBooksId
                    ? () => router.push(`/libro/${book.googleBooksId}`)
                    : undefined
                }
                action={
                  <Button
                    variant="tinted"
                    size="icon-sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedBook(book);
                    }}
                    aria-label={`Agregar ${book.title}`}
                    className="mr-2"
                  >
                    <Plus className="size-5" strokeWidth={2.5} />
                  </Button>
                }
              />
            ))}
          </BookList>
          <ManualEntryLink onClick={() => setIsManualFormOpen(true)} />
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

// Acceso a la carga manual, como botón plain centrado debajo del contenido.
function ManualEntryLink({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="self-center">
      ¿No lo encontrás? Cargalo a mano
    </Button>
  );
}
