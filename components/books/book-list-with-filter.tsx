"use client";

import { useMemo, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { TagFilterSelect, type TagFilterValue } from "@/components/books/tag-filter-select";
import { BookSortSelect } from "@/components/books/book-sort-select";
import { UserBookCard } from "@/components/books/user-book-card";
import { Input } from "@/components/ui/input";
import { sortUserBooks, type BookSortOption } from "@/lib/book-sort";
import { filterUserBooksByQuery } from "@/lib/book-search";
import { useLocalStorageState } from "@/lib/use-local-storage-state";
import type { UserBook } from "@/types/book";

const DEFAULT_SORT_OPTIONS: BookSortOption[] = ["date_added", "alphabetical"];

export function BookListWithFilter({
  items,
  showRating = false,
  storageKey,
  sortOptions = DEFAULT_SORT_OPTIONS,
}: {
  items: UserBook[];
  showRating?: boolean;
  // Namespacea la preferencia de orden en localStorage por categoría (ej.
  // "quiero-leer" / "leidos"), así cada lista recuerda su propia elección.
  storageKey: string;
  sortOptions?: BookSortOption[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TagFilterValue>("all");
  const [sort, setSort] = useLocalStorageState<BookSortOption>(
    `boreli:sort:${storageKey}`,
    sortOptions[0],
  );

  const filtered = useMemo(() => {
    const byQuery = filterUserBooksByQuery(items, query);
    const byTag = filter === "all" ? byQuery : byQuery.filter((item) => item.tags.includes(filter));
    return sortUserBooks(byTag, sort);
  }, [items, query, filter, sort]);

  return (
    <div className="flex flex-col gap-3">
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
        <BookSortSelect value={sort} onChange={setSort} options={sortOptions} />
      </div>

      {filtered.length === 0 ? (
        <p className="px-1 py-10 text-center text-sm text-ink-muted">
          {query.trim() ? "No encontramos libros con esa búsqueda." : "No hay libros con ese formato todavía."}
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((userBook) => (
            <UserBookCard key={userBook.id} userBook={userBook} showRating={showRating} />
          ))}
        </div>
      )}
    </div>
  );
}
