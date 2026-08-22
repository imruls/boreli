"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Search as SearchIcon, X, List, LayoutGrid } from "lucide-react";
import { TagFilterSelect, type TagFilterValue } from "@/components/books/tag-filter-select";
import { BookSortSelect } from "@/components/books/book-sort-select";
import { UserBookCard } from "@/components/books/user-book-card";
import { Input } from "@/components/ui/input";
import { ConfirmationBanner, useConfirmationBanner } from "@/components/ui/confirmation-banner";
import { sortUserBooks, type BookSortOption } from "@/lib/book-sort";
import { filterUserBooksByQuery } from "@/lib/book-search";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
import { cn } from "@/lib/utils";
import type { UserBook } from "@/types/book";

const DEFAULT_SORT_OPTIONS: BookSortOption[] = ["date_added", "alphabetical"];

export function BookListWithFilter({
  items,
  showRating = false,
  storageKey,
  sortOptions = DEFAULT_SORT_OPTIONS,
  // Habilita el toggle lista/grilla. Off por default para no cambiar el
  // comportamiento de listas que no lo pidieron (ej. Quiero leer).
  enableGridView = false,
  // Estado vacío propio de cada lista (ej. "Tu lista de Quiero leer está
  // vacía"), ya renderizado por la page como elemento (`<EmptyState .../>`),
  // no como objeto de config: este componente es Client Component, y un
  // objeto con un ícono de lucide-react (una referencia a función) no se
  // puede pasar cruzando el límite server/client — un elemento sí. Vive acá
  // y no en la page porque este componente es el que sobrevive al
  // revalidate tras borrar un libro, así que es el único lugar donde se
  // puede decidir bien cuándo mostrarlo (ver `onDeleted` de `UserBookCard`
  // más abajo — si se borra el último libro, hay que mostrar primero la
  // confirmación y recién después el estado vacío, no al revés).
  emptyState,
}: {
  items: UserBook[];
  showRating?: boolean;
  // Namespacea la preferencia de orden en localStorage por categoría (ej.
  // "quiero-leer" / "leidos"), así cada lista recuerda su propia elección.
  storageKey: string;
  sortOptions?: BookSortOption[];
  enableGridView?: boolean;
  emptyState: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const { message: confirmation, show: showConfirmation } = useConfirmationBanner();
  const handleDeleted = (title: string) =>
    showConfirmation(`"${title}" eliminado de tu biblioteca`);
  const [filter, setFilter] = useState<TagFilterValue>("all");
  const [sort, setSort] = useLocalStorageState<BookSortOption>(
    `boreli:sort:${storageKey}`,
    sortOptions[0],
  );
  const [view, setView] = useLocalStorageState<"list" | "grid">(`boreli:view:${storageKey}`, "list");

  const filtered = useMemo(() => {
    const byQuery = filterUserBooksByQuery(items, query);
    const byTag = filter === "all" ? byQuery : byQuery.filter((item) => item.tags.includes(filter));
    return sortUserBooks(byTag, sort);
  }, [items, query, filter, sort]);

  // Si se acaba de borrar el último libro de la lista, `items` ya llega
  // vacío en este render (revalidatePath ya corrió), pero todavía queremos
  // mostrar la confirmación antes que el estado vacío — si mostráramos el
  // estado vacío directamente, el usuario nunca ve el cierre de la acción.
  if (items.length === 0) {
    return (
      <>
        <ConfirmationBanner message={confirmation} className="mb-3" />
        {!confirmation ? emptyState : null}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ConfirmationBanner message={confirmation} />

      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por título o autor…"
          aria-label="Buscar en esta lista"
          className="h-10 rounded-xl pl-9 pr-9"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Limpiar búsqueda"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2">
        <TagFilterSelect value={filter} onChange={setFilter} />
        <div className="flex items-center gap-2">
          <BookSortSelect value={sort} onChange={setSort} options={sortOptions} />
          {enableGridView ? (
            <div className="flex items-center rounded-lg border border-ink-border p-0.5">
              <button
                type="button"
                onClick={() => setView("list")}
                aria-label="Ver en lista"
                aria-pressed={view === "list"}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md",
                  view === "list" ? "bg-ink-border text-ink" : "text-ink-muted",
                )}
              >
                <List className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("grid")}
                aria-label="Ver en grilla"
                aria-pressed={view === "grid"}
                className={cn(
                  "flex size-7 items-center justify-center rounded-md",
                  view === "grid" ? "bg-ink-border text-ink" : "text-ink-muted",
                )}
              >
                <LayoutGrid className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="px-1 py-10 text-center text-sm text-ink-muted">
          {query.trim() ? "No encontramos libros con esa búsqueda." : "No hay libros con ese formato todavía."}
        </p>
      ) : enableGridView && view === "grid" ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {filtered.map((userBook) => (
            <UserBookCard
              key={userBook.id}
              userBook={userBook}
              showRating={showRating}
              layout="grid"
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((userBook) => (
            <UserBookCard
              key={userBook.id}
              userBook={userBook}
              showRating={showRating}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}
