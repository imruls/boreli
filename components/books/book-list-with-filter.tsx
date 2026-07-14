"use client";

import { useMemo, useState } from "react";
import { TagFilterSelect, type TagFilterValue } from "@/components/books/tag-filter-select";
import { BookSortSelect } from "@/components/books/book-sort-select";
import { BookCard } from "@/components/books/book-card";
import { BookTagBadge } from "@/components/books/book-tag-badge";
import { RatingStars } from "@/components/books/rating-stars";
import { BookEditMenuButton } from "@/components/books/book-edit-menu-button";
import { sortUserBooks, type BookSortOption } from "@/lib/book-sort";
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
  const [filter, setFilter] = useState<TagFilterValue>("all");
  const [sort, setSort] = useLocalStorageState<BookSortOption>(
    `boreli:sort:${storageKey}`,
    sortOptions[0],
  );

  const filtered = useMemo(() => {
    const byTag = filter === "all" ? items : items.filter((item) => item.tags.includes(filter));
    return sortUserBooks(byTag, sort);
  }, [items, filter, sort]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <TagFilterSelect value={filter} onChange={setFilter} />
        <BookSortSelect value={sort} onChange={setSort} options={sortOptions} />
      </div>

      {filtered.length === 0 ? (
        <p className="px-1 py-10 text-center text-sm text-ink-muted">
          No hay libros con ese formato todavía.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((userBook) => (
            <BookCard
              key={userBook.id}
              title={userBook.book.title}
              authors={userBook.book.authors}
              coverUrl={userBook.book.coverUrl}
              trustedCover={Boolean(userBook.book.googleBooksId)}
              meta={
                userBook.tags.length > 0 || (showRating && userBook.rating) ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {showRating && userBook.rating ? <RatingStars rating={userBook.rating} /> : null}
                    {userBook.tags.map((tag) => (
                      <BookTagBadge key={tag} tag={tag} />
                    ))}
                  </div>
                ) : undefined
              }
              action={
                <BookEditMenuButton
                  userBookId={userBook.id}
                  bookTitle={userBook.book.title}
                  currentStatus={userBook.status}
                  currentTags={userBook.tags}
                  currentRating={userBook.rating}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
